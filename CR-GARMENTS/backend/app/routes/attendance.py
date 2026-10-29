from flask import Blueprint, jsonify
from app.models import Attendance
from app.extensions import db
from app.middleware.auth import token_required
from datetime import datetime

bp = Blueprint("attendance", __name__)


@bp.route("/", methods=["GET"])
@token_required
def get_all_attendance(current_user):
    try:
        if current_user.role in ["ADMIN", "MANAGER"]:
            records = Attendance.query.order_by(Attendance.date.desc()).limit(100).all()
        else:
            records = (
                Attendance.query.filter_by(user_id=current_user.id)
                .order_by(Attendance.date.desc())
                .limit(30)
                .all()
            )

        data = []
        for r in records:
            data.append(
                {
                    "id": r.id,
                    "user_id": r.user_id,
                    "user_name": r.user.name if r.user else "Unknown",
                    "user_email": r.user.email if r.user else "",
                    "date": r.date.isoformat() if r.date else None,
                    "status": r.status,
                    "tap_in": r.tap_in.isoformat() if r.tap_in else None,
                    "tap_out": r.tap_out.isoformat() if r.tap_out else None,
                }
            )
        return jsonify({"success": True, "data": data})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 400


@bp.route("/tap-in", methods=["POST"])
@token_required
def tap_in(current_user):
    try:
        today = datetime.utcnow().date()
        existing = Attendance.query.filter_by(
            user_id=current_user.id, date=today
        ).first()

        if existing and existing.tap_in:
            return (
                jsonify({"success": False, "message": "Already tapped in today"}),
                400,
            )

        if existing:
            existing.tap_in = datetime.utcnow()
            existing.status = "PRESENT"
        else:
            new_attendance = Attendance(
                user_id=current_user.id,
                date=today,
                status="PRESENT",
                tap_in=datetime.utcnow(),
            )
            db.session.add(new_attendance)

        db.session.commit()
        return jsonify({"success": True, "message": "Tapped in successfully"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": str(e)}), 400


@bp.route("/tap-out", methods=["POST"])
@token_required
def tap_out(current_user):
    try:
        today = datetime.utcnow().date()
        existing = Attendance.query.filter_by(
            user_id=current_user.id, date=today
        ).first()

        if not existing or not existing.tap_in:
            return jsonify({"success": False, "message": "Must tap in first"}), 400

        if existing.tap_out:
            return (
                jsonify({"success": False, "message": "Already tapped out today"}),
                400,
            )

        existing.tap_out = datetime.utcnow()
        db.session.commit()
        return jsonify({"success": True, "message": "Tapped out successfully"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": str(e)}), 400


@bp.route("/check", methods=["GET"])
@token_required
def check_attendance(current_user):
    today = datetime.utcnow().date()
    existing = Attendance.query.filter_by(user_id=current_user.id, date=today).first()

    return jsonify(
        {
            "success": True,
            "data": {
                "marked": existing is not None and existing.tap_in is not None,
                "tap_in": (
                    existing.tap_in.isoformat()
                    if existing and existing.tap_in
                    else None
                ),
                "tap_out": (
                    existing.tap_out.isoformat()
                    if existing and existing.tap_out
                    else None
                ),
            },
        }
    )
