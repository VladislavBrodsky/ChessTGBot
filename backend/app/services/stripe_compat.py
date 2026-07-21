"""Compatibility helpers for Stripe's mapping-like SDK response objects."""


def stripe_get(value, key: str, default=None):
    """Read a Stripe field from either a dict or modern StripeObject.

    Stripe Python v15 response objects support ``obj[key]`` but no longer
    implement ``obj.get(key)``. Keeping this boundary explicit lets webhook
    tests continue to use plain dictionaries while production uses the SDK.
    """
    if value is None:
        return default
    if isinstance(value, dict):
        return value.get(key, default)
    try:
        return value[key]
    except (AttributeError, KeyError, TypeError):
        return getattr(value, key, default)
