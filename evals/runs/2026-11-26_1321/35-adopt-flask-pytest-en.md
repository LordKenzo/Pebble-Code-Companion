```json
{
  "reading": "A small, consistent Flask API for orders, at version 0.3.0. Routes stay thin and delegate to a service module that holds the domain rules and talks to the database. Domain errors are a custom exception, translated to HTTP 400 at the route. Money is handled as Decimal and serialized as a string. Tests use pytest with pytest-flask and are mostly green. The one red test, test_apply_discount_is_capped, matches an open TODO in apply_discount: the 50% cap was specified in the test but never implemented.",
  "name": "shop-api",
  "what": "A Flask HTTP API for creating orders and applying discounts, backed by SQLAlchemy.",
  "stack": [
    "Python >=3.11",
    "Flask >=3.0 (Blueprints)",
    "SQLAlchemy >=2.0, accessed through a `db` object exported by app/models.py",
    "pytest >=8",
    "pytest-flask >=1.3",
    "Packaging via pyproject.toml, with dev extras installed by `pip install -e .[dev]`"
  ],
  "constraints": [
    "Route handlers parse the request, call a service function, and map the result or error to JSON. They contain no business rules.",
    "Business rules live in app/services/, as plain functions that take and return model objects.",
    "Monetary amounts are computed as Decimal and returned in JSON as strings.",
    "Domain failures are raised as a module-specific exception (OrderError) and become HTTP 400 at the route.",
    "Service functions commit the database session themselves.",
    "Tests live in tests/, with one file per app module, and use the `app` fixture."
  ],
  "unknowns": [
    "The `app` fixture is used in tests/test_orders.py, but no conftest.py appears in the tree. It's unclear where the fixture and the test database are set up.",
    "apply_discount has an open TODO for the 50% cap, and its test is red.",
    "apply_discount doesn't validate `percent`, so negative or over-100 values are accepted. It isn't exposed by any route yet.",
    "POST /orders handles only OrderError. Malformed JSON or a missing `customer_id` or `items` key would raise and likely return 500.",
    "Totals aren't quantized. A discount can produce Decimals with more than two decimal places.",
    "app/models.py and tests/test_routes.py weren't read. The setup of `db` and the coverage of the route tests are unknown.",
    "The dependencies list `sqlalchemy`, but the code uses `db.session`, a Flask-SQLAlchemy style. It isn't confirmed which integration provides `db`."
  ],
  "decisions": [
    {
      "title": "Flask with Blueprints for HTTP routing",
      "context": "The API exposes order endpoints over HTTP.",
      "decision": "Routes are grouped in Flask Blueprints and declared with method-specific decorators such as `@bp.post`.",
      "consequences": "New endpoint groups get their own Blueprint, and the app registers them. Handlers stay framework-specific and thin.",
      "evidence": ["pyproject.toml:5", "app/routes.py:4", "app/routes.py:7"]
    },
    {
      "title": "Service layer holds the business logic",
      "context": "Order rules such as totals, validation and discounts must be testable without HTTP.",
      "decision": "Domain operations are plain functions in app/services/<area>.py. Routes call them and only translate inputs and outputs.",
      "consequences": "Logic is tested directly against services, as in tests/test_orders.py. New rules go in services, not in routes.",
      "evidence": ["app/services/orders.py:9", "app/services/orders.py:19", "app/routes.py:11"]
    },
    {
      "title": "Domain errors as custom exceptions mapped to 400",
      "context": "Invalid orders must be reported to the client without leaking internals.",
      "decision": "Services raise a module-specific exception (OrderError). Routes catch it and return `{error: message}` with status 400.",
      "consequences": "Each service area defines its own error type, and the route is the single place that maps it to HTTP. Errors that aren't domain errors are not handled there.",
      "evidence": ["app/services/orders.py:5", "app/services/orders.py:11", "app/routes.py:12-13"]
    },
    {
      "title": "Money as Decimal, serialized as string",
      "context": "Order totals must be exact. The git history has the commit 'fix: decimal totals'.",
      "decision": "Prices are converted with `Decimal(...)` before arithmetic, and totals are returned in JSON as `str(order.total)`.",
      "consequences": "Floats are never used for money, and clients receive exact string values. Rounding and quantization still have to be decided explicitly.",
      "evidence": ["app/services/orders.py:1", "app/services/orders.py:12", "app/routes.py:14", "git: fix: decimal totals"]
    },
    {
      "title": "Services own the transaction commit",
      "context": "Each operation persists its changes.",
      "decision": "Each service function calls `db.session.add`/`commit` itself, before returning.",
      "consequences": "One service call equals one transaction. Composing several services in a single atomic operation would need a different pattern.",
      "evidence": ["app/services/orders.py:14-15", "app/services/orders.py:22"]
    },
    {
      "title": "pytest with pytest-flask, one test file per module",
      "context": "The project needs automated tests for services and routes.",
      "decision": "Tests use pytest and pytest-flask, live in tests/ (set in testpaths), and follow the naming test_<module>.py. They depend on an `app` fixture.",
      "consequences": "New tests follow the same layout and fixture. Service tests run with an app context and a database.",
      "evidence": ["pyproject.toml:8", "pyproject.toml:10-11", "tests/test_orders.py:5"]
    }
  ],
  "conflicts": [],
  "layers": "Two layers. HTTP lives in app/routes.py, as Flask Blueprints that parse JSON and map OrderError to 400. Domain and persistence live in app/services/, as functions that apply the rules and commit through `db`. Models and the `db` object sit in app/models.py.",
  "folders": "app/ holds the application package: routes.py (HTTP), models.py (ORM models and db), and services/ (business logic, one module per area). tests/ holds the pytest suite, with test_<module>.py per area.",
  "paths": [
    "Resolve the TODO in apply_discount (app/services/orders.py:20) so that test_apply_discount_is_capped turns green. The test already defines the expected behaviour.",
    "Add a test for apply_discount with an invalid percent (negative or over 100), and decide whether that case raises OrderError.",
    "Add a route test for POST /orders with a missing `items` key or a malformed body. It currently can't return a clean 400.",
    "Add a test showing a discounted total with more than two decimal places, then decide on quantizing totals to cents."
  ],
  "question": "When a discount above 50% is requested, should apply_discount silently cap it at 50% (as the red test expects) or reject it with OrderError?"
}
```
