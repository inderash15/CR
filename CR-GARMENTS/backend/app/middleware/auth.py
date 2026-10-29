from functools import wraps
from flask import request, jsonify, current_app
import jwt
from app.models import User
from app.extensions import db


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if "Authorization" in request.headers:
            auth_header = request.headers["Authorization"]
            if auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]

        if not token:
            return jsonify({"success": False, "message": "Token is missing!"}), 401

        try:
            data = jwt.decode(
                token, current_app.config["SECRET_KEY"], algorithms=["HS256"]
            )
            current_user = db.session.get(User, data["user_id"])
            if not current_user:
                raise Exception("User not found")
        except Exception:
            return jsonify({"success": False, "message": "Token is invalid!"}), 401

        return f(current_user, *args, **kwargs)

    return decorated


def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if "Authorization" in request.headers:
            auth_header = request.headers["Authorization"]
            if auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]

        if not token:
            return jsonify({"success": False, "message": "Token is missing!"}), 401

        try:
            data = jwt.decode(
                token, current_app.config["SECRET_KEY"], algorithms=["HS256"]
            )
            current_user = db.session.get(User, data["user_id"])
            if not current_user or current_user.role != "ADMIN":
                return (
                    jsonify({"success": False, "message": "Admin access required."}),
                    403,
                )
        except Exception:
            return jsonify({"success": False, "message": "Token is invalid!"}), 401

        return f(current_user, *args, **kwargs)

    return decorated
