```json
{
  "reading": "A small, consistent Flask API for orders, cleanly layered: routes in a Blueprint call plain service functions, which work on SQLAlchemy models through db.session. Money is handled with Decimal and serialized as a string. Domain errors are raised as OrderError in the service and mapped to HTTP 400 in the route. Tests use pytest with pytest-flask and an `app` fixture. One test is red, and it matches the open TODO in apply_discount: the 50% discount cap was never implemented.",
  "name": "shop-api",
  "what": "A Flask HTTP API that creates orders, computes their totals from line items, and applies percentage discounts, persisting them with SQLAlchemy.",
  "stack": [
    "Python >= 3.11",
    "Flask >= 3.0 (Blueprints)",
    "SQLAlchemy >= 2.0 (accessed via a `db` object exported by app/models.py)",
    "pytest >= 8",
    "pytest-flask >= 1.3",
    "pyproject.toml with an optional `dev` extra (`pip install -e .[dev]`)"
  ],
  "constraints": [
    "HTTP handling lives in app/routes.py, business rules in app/services/, persistence models in app/models.py",
    "Monetary values are Decimal and are serialized to JSON as strings",
    "Domain failures raise OrderError; routes catch it and return 400 with `{error: message}`",
    "Service functions commit the session themselves before returning",
    "Tests live in tests/ and receive the `app` fixture from pytest-flask"
  ],
  "unknowns": [
    "Where the `app` fixture is defined: there is no conftest.py in the file list, yet the tests request it",
    "`db.session` looks like Flask-SQLAlchemy, but pyproject.toml only lists plain `sqlalchemy`",
    "apply_discount is not exposed by any route, so it is unclear how discounts are triggered",
    "POST /orders does not validate the body: a missing `customer_id` or `items`, or a missing `price`/`qty`, raises KeyError and becomes a 500 instead of a 400",
    "apply_discount accepts any percent, including negative values or values over 100",
    "tests/test_routes.py, app/models.py and app/__init__.py were not read, so the model fields and the app setup are not confirmed"
  ],
  "decisions": [
    {
      "title": "Flask with Blueprints for the HTTP layer",
      "context": "The API needs to expose order endpoints.",
      "decision": "Routes are grouped in a Flask Blueprint, using the method-specific decorators (`bp.post`).",
      "consequences": "New endpoints go in a Blueprint. The app object has to register each Blueprint.",
      "evidence": ["pyproject.toml:5", "app/routes.py:1-4", "app/routes.py:7"]
    },
    {
      "title": "Business logic in a service layer, separate from routes",
      "context": "Order rules such as totals and discounts must be testable without HTTP.",
      "decision": "Rules live in plain functions in app/services/orders.py. Routes only parse the request, call the service and shape the response.",
      "consequences": "Services can be unit-tested directly, as tests/test_orders.py does. Routes stay thin.",
      "evidence": ["app/services/orders.py:9-23", "app/routes.py:11", "tests/test_orders.py:2"]
    },
    {
      "title": "Domain errors as exceptions, mapped to HTTP in routes",
      "context": "Invalid orders must be rejected with a clear message.",
      "decision": "The service raises a dedicated OrderError. The route catches it and returns 400 with `{\"error\": message}`.",
      "consequences": "New domain failures should raise OrderError, or a subclass of it. Errors that are not OrderError currently surface as 500.",
      "evidence": ["app/services/orders.py:5-11", "app/routes.py:12-13", "tests/test_orders.py:10-12"]
    },
    {
      "title": "Decimal for money, serialized as strings",
      "context": "Floating-point totals are inexact. A past commit fixed this ('fix: decimal totals').",
      "decision": "Prices are converted with Decimal before multiplying, and totals are returned to clients as strings.",
      "consequences": "Every new money computation must stay in Decimal. JSON responses expose totals as strings, not numbers.",
      "evidence": ["app/services/orders.py:1", "app/services/orders.py:12", "app/routes.py:14", "tests/test_orders.py:7"]
    },
    {
      "title": "Services own the transaction",
      "context": "Orders must be persisted when created or modified.",
      "decision": "Each service function adds and commits through db.session before returning.",
      "consequences": "Callers get persisted objects. Combining two service calls in one atomic transaction is not possible as written.",
      "evidence": ["app/services/orders.py:14-15", "app/services/orders.py:22"]
    },
    {
      "title": "pytest with pytest-flask",
      "context": "The service and the routes need automated tests.",
      "decision": "Tests run with pytest from tests/, and test functions take the `app` fixture provided through pytest-flask.",
      "consequences": "New tests use pytest style (plain asserts, pytest.raises) and the `app` fixture whenever they touch the database.",
      "evidence": ["pyproject.toml:8-11", "tests/test_orders.py:1", "tests/test_orders.py:5"]
    }
  ],
  "conflicts": [],
  "layers": "Three layers: HTTP (app/routes.py, Flask Blueprint) → services (app/services/orders.py, domain rules and transactions) → models (app/models.py, SQLAlchemy models and the `db` handle). Tests target the services directly and the routes separately.",
  "folders": "app/ holds the package: routes.py, models.py and services/ with one module per domain area (orders.py). tests/ mirrors it with test_<module>.py files. Configuration lives in pyproject.toml.",
  "paths": [
    "Make test_apply_discount_is_capped green. It was red before adoption, and it matches the TODO in app/services/orders.py:20: cap the discount at 50%, so 80% on a 10.00 order gives 5.",
    "Add a test for apply_discount with an out-of-range percent (negative, or over 100) and decide whether it raises OrderError.",
    "Add route tests for POST /orders with a missing `customer_id` or `items` that expect 400 instead of 500, then make them pass.",
    "Declare the real database dependency in pyproject.toml (Flask-SQLAlchemy if that is what `db` is), so that a fresh `pip install -e .[dev]` works."
  ],
  "question": "Does `db` in app/models.py come from Flask-SQLAlchemy? It is not listed in pyproject.toml, and the answer decides how the session and the test fixture should be set up."
}
```
