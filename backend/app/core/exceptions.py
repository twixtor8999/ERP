"""Centralized exception classes and global error handling for AI Smart Bazar."""
from typing import Any

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.core.logging import logger


class ERPError(Exception):
    """Base exception class for all enterprise domain errors."""

    def __init__(
        self,
        message: str,
        code: str = "INTERNAL_ERROR",
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        details: dict[str, Any] | None = None,
    ):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details or {}


ERPException = ERPError


class AuthenticationError(ERPError):
    def __init__(self, message: str = "Invalid credentials or session expired"):
        super().__init__(
            message=message,
            code="AUTHENTICATION_FAILED",
            status_code=status.HTTP_401_UNAUTHORIZED,
        )


class PermissionDeniedError(ERPError):
    def __init__(self, message: str = "You do not have permission to perform this action"):
        super().__init__(
            message=message,
            code="PERMISSION_DENIED",
            status_code=status.HTTP_403_FORBIDDEN,
        )


class BranchAccessDeniedError(ERPError):
    def __init__(self, branch_id: str):
        super().__init__(
            message=f"Access to branch '{branch_id}' is not authorized for your account",
            code="BRANCH_ACCESS_DENIED",
            status_code=status.HTTP_403_FORBIDDEN,
            details={"branch_id": branch_id},
        )


class ResourceNotFoundError(ERPError):
    def __init__(self, resource: str, identifier: Any):
        super().__init__(
            message=f"{resource} with identifier '{identifier}' was not found",
            code="RESOURCE_NOT_FOUND",
            status_code=status.HTTP_404_NOT_FOUND,
            details={"resource": resource, "identifier": str(identifier)},
        )


class BusinessRuleViolationError(ERPError):
    def __init__(self, message: str, details: dict[str, Any] | None = None):
        super().__init__(
            message=message,
            code="BUSINESS_RULE_VIOLATION",
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            details=details,
        )


def register_exception_handlers(app: FastAPI) -> None:
    """Register centralized FastAPI exception handlers."""

    @app.exception_handler(ERPError)
    async def erp_exception_handler(request: Request, exc: ERPError) -> JSONResponse:
        request_id = getattr(request.state, "request_id", None)
        logger.warning(
            f"ERP domain error: {exc.code} - {exc.message}",
            extra={"request_id": request_id, "code": exc.code},
        )
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "error": {
                    "code": exc.code,
                    "message": exc.message,
                    "details": exc.details,
                },
                "requestId": request_id,
            },
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        request_id = getattr(request.state, "request_id", None)
        errors: list[dict[str, Any]] = []
        for err in exc.errors():
            loc = [str(x) for x in err.get("loc", [])]
            errors.append(
                {
                    "loc": loc,
                    "msg": err.get("msg", ""),
                    "type": err.get("type", ""),
                }
            )

        logger.info(
            f"Validation failed for request {request.url.path}: {len(errors)} errors",
            extra={"request_id": request_id, "errors": errors},
        )

        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "success": False,
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Invalid request parameters or payload",
                    "details": errors,
                },
                "requestId": request_id,
            },
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        request_id = getattr(request.state, "request_id", None)
        logger.error(
            f"Unhandled server error on {request.method} {request.url.path}: {str(exc)}",
            exc_info=True,
            extra={"request_id": request_id},
        )
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "success": False,
                "error": {
                    "code": "INTERNAL_SERVER_ERROR",
                    "message": "An unexpected server error occurred. Please contact IT support.",
                },
                "requestId": request_id,
            },
        )
