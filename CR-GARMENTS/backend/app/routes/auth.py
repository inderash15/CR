from flask import Blueprint, request, jsonify, current_app
from app.models import User
import jwt
from datetime import datetime, timedelta
from app.middleware.auth import token_required

bp = Blueprint("auth", __name__)


@bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return (
            jsonify({"success": False, "message": "Email and password are required"}),
            400,
        )

    user = User.query.filter_by(email=email).first()

    if not user or not user.check_password(password):
        return jsonify({"success": False, "message": "Invalid email or password."}), 401

    if not user.status:
        return jsonify({"success": False, "message": "User account is disabled."}), 403

    token = jwt.encode(
        {
            "user_id": user.id,
            "role": user.role,
            "exp": datetime.utcnow() + timedelta(days=1),
        },
        current_app.config["SECRET_KEY"],
        algorithm="HS256",
    )

    return jsonify(
        {
            "success": True,
            "message": "Login successful",
            "data": {
                "token": token,
                "user": {
                    "id": user.id,
                    "name": user.name,
                    "email": user.email,
                    "role": user.role,
                },
            },
        }
    )


@bp.route("/me", methods=["GET"])
@token_required
def get_me(current_user):
    return jsonify(
        {
            "success": True,
            "message": "User retrieved successfully",
            "data": {
                "id": current_user.id,
                "name": current_user.name,
                "email": current_user.email,
                "role": current_user.role,
            },
        }
    )


@bp.route("/users", methods=["GET"])
@token_required
def get_users(current_user):
    if current_user.role not in ["ADMIN", "MANAGER"]:
        return jsonify({"success": False, "message": "Unauthorized"}), 403
    users = User.query.all()
    data = []
    for u in users:
        data.append(
            {
                "id": u.id,
                "name": u.name,
                "email": u.email,
                "role": u.role,
                "status": u.status,
            }
        )
    return jsonify({"success": True, "data": data})
