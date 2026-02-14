import json
from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.http import require_http_methods
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from django.views.decorators.csrf import ensure_csrf_cookie
from .models import EmailLog, SmsLog, WhatsappLog

@ensure_csrf_cookie
def dashboard(request):
    # UI will be added in next steps
    return render(request, "dashboard.html")


def _email_to_dict(row: EmailLog):
    return {
        "id": row.id,
        "email_to": row.email_to,
        "created_at": row.created_at.isoformat(),
    }


def _msg_to_dict(row):
    return {
        "id": row.id,
        "mobile_number": row.mobile_number,
        "message": row.message,
        "created_at": row.created_at.isoformat(),
    }


@require_http_methods(["GET", "POST"])
def email_api(request):
    if request.method == "GET":
        rows = EmailLog.objects.order_by("-created_at")
        return JsonResponse([_email_to_dict(r) for r in rows], safe=False)

    # POST
    try:
        data = json.loads(request.body.decode("utf-8"))
    except Exception:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    email_to = (data.get("email_to") or "").strip()

    try:
        validate_email(email_to)
    except ValidationError:
        return JsonResponse({"error": "Valid email_to is required"}, status=400)

    EmailLog.objects.create(email_to=email_to)
    return JsonResponse({"ok": True}, status=201)


@require_http_methods(["GET", "POST"])
def sms_api(request):
    if request.method == "GET":
        rows = SmsLog.objects.order_by("-created_at")
        return JsonResponse([_msg_to_dict(r) for r in rows], safe=False)

    try:
        data = json.loads(request.body.decode("utf-8"))
    except Exception:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    mobile = (data.get("mobile_number") or "").strip()
    message = (data.get("message") or "").strip()

    if not mobile or not message:
        return JsonResponse({"error": "mobile_number and message are required"}, status=400)

    SmsLog.objects.create(mobile_number=mobile, message=message)
    return JsonResponse({"ok": True}, status=201)


@require_http_methods(["GET", "POST"])
def whatsapp_api(request):
    if request.method == "GET":
        rows = WhatsappLog.objects.order_by("-created_at")
        return JsonResponse([_msg_to_dict(r) for r in rows], safe=False)

    try:
        data = json.loads(request.body.decode("utf-8"))
    except Exception:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    mobile = (data.get("mobile_number") or "").strip()
    message = (data.get("message") or "").strip()

    if not mobile or not message:
        return JsonResponse({"error": "mobile_number and message are required"}, status=400)

    WhatsappLog.objects.create(mobile_number=mobile, message=message)
    return JsonResponse({"ok": True}, status=201)


@require_http_methods(["GET"])
def stats_api(request):
    return JsonResponse({
        "emails": EmailLog.objects.count(),
        "sms": SmsLog.objects.count(),
        "whatsapp": WhatsappLog.objects.count(),
    })


@require_http_methods(["POST"])
def delete_api(request):
    try:
        data = json.loads(request.body.decode("utf-8"))
    except Exception:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    type_ = (data.get("type") or "").strip()
    id_ = data.get("id")

    try:
        id_ = int(id_)
    except Exception:
        return JsonResponse({"error": "Valid id is required"}, status=400)

    model_map = {
        "email": EmailLog,
        "sms": SmsLog,
        "whatsapp": WhatsappLog,
    }

    Model = model_map.get(type_)
    if not Model:
        return JsonResponse({"error": "Valid type is required (email/sms/whatsapp)"}, status=400)

    deleted, _ = Model.objects.filter(id=id_).delete()
    return JsonResponse({"ok": True, "deleted": deleted})