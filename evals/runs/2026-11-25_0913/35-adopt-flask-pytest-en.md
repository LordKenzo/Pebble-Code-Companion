```json
{
  "reading": "shop-api is a small Flask API for orders, at version 0.3.0 with 63 commits. Routes are thin Blueprint handlers that delegate to a service module, which works with SQLAlchemy models and raises a domain exception that the routes map to HTTP 400. Money is handled as Decimal. Tests use pytest with pytest-flask. 5 of 6 tests are green. The red one is test_apply_discount_is_capped, which matches the open TODO in apply_discount.",
  "name": "shop-api",
  "what": "A small Flask HTTP API for creating orders and applying discounts, persisting them through SQLAlchemy.",
  "stack": [
    "Python >= 3.11",
    "Flask >= 3.0 (Blueprints)",
    "SQLAlchemy >= 2.0, used through a `db` object with `db.session` from app/models.py",
    "pytest >= 8",
    "pytest-flask >= 1.3",
    "Packaging via pyproject.toml with a `dev` extra (`pip install -e .[dev]`)"
  ],
  "constraints": [
    "HTTP handlers live in app/routes.py on the `orders` Blueprint and only parse the request, call a service and shape the JSON response.",
    "Business rules live in app/services/ as plain functions that take and return model objects.",
    "Domain failures are raised as a module-specific exception (OrderError) and translated to `400 {\"error\": ...}` in the route.",
    "Monetary amounts are Decimal, built from string prices, and serialized back as strings in responses.",
    "Service functions commit the session themselves after each change.",
    "Service functions use type hints (`customer_id: int`, `items: list[dict]`, `-> Order`).",
    "Tests are in tests/, one file per module (test_orders.py, test_routes.py), named `test_<function>_<behaviour>` and run against the `app` fixture."
  ],
  "unknowns": [
    "app/services/orders.py line 20: TODO 'cap the discount at 50%' is not implemented. This is why test_apply_discount_is_capped is red (80% currently yields 2, the test expects 5).",
    "No conftest.py appears in the tree, yet every test takes an `app` fixture (pytest-flask expects you to define it). It is unclear where it is defined.",
    "`db.session` suggests Flask-SQLAlchemy, but pyproject.toml line 5 declares only `sqlalchemy`. app/models.py was not shown, so it is unclear how `db` is built.",
    "POST /orders has no test for a malformed payload (missing `customer_id` or `items`, or a non-JSON body). Currently that path would raise KeyError or TypeError and return 500.",
    "apply_discount has no route yet, and there is no test for negative or zero percentages.",
    "app/__init__.py was not shown: it is unclear whether there is an application factory and how the Blueprint and database are registered."
  ],
  "decisions": [
    {
      "title": "Flask with Blueprints for the HTTP layer",
      "context": "The API needs an HTTP layer, and the project is small.",
      "decision": "Flask 3, with routes grouped in a Blueprint per area (`orders`) and registered on the app.",
      "consequences": "New areas get their own Blueprint. Handlers stay framework-specific and should stay thin.",
      "evidence": [
        "pyproject.toml line 5: flask>=3.0",
        "app/routes.py line 4: bp = Blueprint(\"orders\", __name__)",
        "app/routes.py line 7: @bp.post(\"/orders\")"
      ]
    },
    {
      "title": "Business logic in a service layer, routes stay thin",
      "context": "Order rules (validation, totals, discounts) should be testable without HTTP.",
      "decision": "Logic lives in app/services/<area>.py as module-level functions. Routes only extract input, call the service and build the response.",
      "consequences": "Services can be unit-tested directly, as in tests/test_orders.py. Services depend on models and the session, so tests need a database-backed app fixture.",
      "evidence": [
        "app/services/orders.py lines 9-23: create_order, apply_discount",
        "app/routes.py line 11: order = create_order(data[\"customer_id\"], data[\"items\"])",
        "tests/test_orders.py line 2: imports services directly"
      ]
    },
    {
      "title": "Domain errors as a custom exception mapped to HTTP 400",
      "context": "Invalid business input must reach the client as a clear error.",
      "decision": "Each service module defines its own exception (OrderError). Services raise it with a human-readable message, and routes catch it and return `jsonify(error=str(e)), 400`.",
      "consequences": "Error messages are written once, in the service. Any other exception (KeyError, TypeError) is not mapped and becomes a 500.",
      "evidence": [
        "app/services/orders.py lines 5-6: class OrderError(Exception)",
        "app/services/orders.py line 11: raise OrderError(...)",
        "app/routes.py lines 12-13: except OrderError → 400"
      ]
    },
    {
      "title": "Money as Decimal, strings at the edges",
      "context": "Floats give wrong totals (see commit 'fix: decimal totals').",
      "decision": "Prices arrive as strings, are converted with Decimal, totals are Decimal, and responses serialize them with str().",
      "consequences": "Totals are exact. Every arithmetic step on money must stay in Decimal, and JSON clients receive totals as strings.",
      "evidence": [
        "app/services/orders.py line 12: Decimal(i[\"price\"]) * i[\"qty\"]",
        "app/routes.py line 14: total=str(order.total)",
        "tests/test_orders.py line 7: assert str(order.total) == \"5.00\"",
        "git: 'fix: decimal totals'"
      ]
    },
    {
      "title": "Services own the transaction commit",
      "context": "Persistence must happen somewhere after each change.",
      "decision": "Each service function that mutates data calls db.session.commit() before returning.",
      "consequences": "Callers get persisted objects with ids immediately. Composing several service calls in one transaction is not possible without changing this.",
      "evidence": [
        "app/services/orders.py lines 14-15: add + commit",
        "app/services/orders.py line 22: commit"
      ]
    },
    {
      "title": "pytest with pytest-flask, an `app` fixture per test",
      "context": "Services and routes both touch the Flask app and the database.",
      "decision": "Tests use pytest with pytest-flask. Every test that touches the database requests the `app` fixture. testpaths is set to tests/.",
      "consequences": "Tests run with a plain `pytest`. Each test depends on the fixture setting up and isolating the database.",
      "evidence": [
        "pyproject.toml line 8: pytest>=8, pytest-flask>=1.3",
        "pyproject.toml line 11: testpaths = [\"tests\"]",
        "tests/test_orders.py lines 5, 10, 15: (app) fixture"
      ]
    }
  ],
  "conflicts": [
    {
      "topic": "Invalid input: OrderError vs unhandled exceptions",
      "question": "An empty `items` list returns 400 via OrderError, while a missing `customer_id`/`items` key or a non-JSON body raises KeyError/TypeError and returns 500 (app/routes.py lines 9-11). For new code, should malformed payloads also become a 400, validated in the route or raised as OrderError in the service?"
    }
  ],
  "layers": "HTTP (app/routes.py, Flask Blueprint) → services (app/services/, business rules, domain exceptions, commits) → models (app/models.py, SQLAlchemy models and `db`). Routes depend on services, services depend on models, and models depend on nothing in the app. Tests hit services directly (tests/test_orders.py) and the HTTP layer through the client (tests/test_routes.py).",
  "folders": "app/ — the application package (app/__init__.py: setup and registration). app/routes.py — HTTP handlers on the `orders` Blueprint. app/models.py — SQLAlchemy models and the `db` object. app/services/ — business logic, one module per area (orders.py). tests/ — pytest suite, one file per module.",
  "paths": [
    "Make test_apply_discount_is_capped green by resolving the TODO at app/services/orders.py line 20 (cap at 50%), then add a test for a discount below the cap and one exactly at 50.",
    "Add a route test for POST /orders with a missing key or a non-JSON body, and decide what status it should return (see the conflict above).",
    "Make the test setup explicit: check where the `app` fixture lives (add tests/conftest.py if it's missing) and that each test gets an isolated database.",
    "Declare the actual database dependency in pyproject.toml if `db` comes from Flask-SQLAlchemy, so `pip install -e .[dev]` works on a clean machine."
  ],
  "question": "Is the `db` object in app/models.py a Flask-SQLAlchemy instance? If so, it is missing from pyproject.toml dependencies, and that changes the first fix to make."
}
```
