"""Uniform error envelope for every API response.

The frontend reads `detail` for the human message and `errors` for per-field
messages, so it never has to guess at DRF's several error shapes.
"""

from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import IntegrityError
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler


def _first_message(payload):
    """Pull one readable sentence out of an arbitrary DRF error body."""
    if isinstance(payload, str):
        return payload
    if isinstance(payload, list) and payload:
        return _first_message(payload[0])
    if isinstance(payload, dict):
        for key in ("detail", "non_field_errors"):
            if key in payload:
                return _first_message(payload[key])
        for value in payload.values():
            return _first_message(value)
    return "Request failed."


def api_exception_handler(exc, context):
    # Django's own ValidationError (raised from model.save/clean) is not handled
    # by DRF out of the box and would otherwise surface as a 500.
    if isinstance(exc, DjangoValidationError):
        messages = exc.messages if hasattr(exc, "messages") else [str(exc)]
        return Response(
            {"detail": messages[0], "errors": {"non_field_errors": messages}},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if isinstance(exc, IntegrityError):
        return Response(
            {"detail": "That change conflicts with existing data.", "errors": {}},
            status=status.HTTP_409_CONFLICT,
        )

    response = drf_exception_handler(exc, context)
    if response is None:
        return None

    data = response.data
    errors = data if isinstance(data, dict) else {"non_field_errors": data}
    response.data = {"detail": _first_message(data), "errors": errors}
    return response
