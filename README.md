# System Communication Dashboard — Django Version

## Overview
A full-stack dashboard to log system communications:
- Emails
- SMS
- WhatsApp

This project **does not send real Email/SMS/WhatsApp**. It only creates database entries and displays them in tab-based list views.

## Features
- Tabs: Emails / SMS / WhatsApp
- Different list view columns per channel
- Modal forms to create logs (AJAX)
- Toast notifications (success/error)
- Dashboard counts (Email/SMS/WhatsApp)
- Search per tab
- Delete with confirmation
- Export CSV
- Light/Dark mode toggle (Bootswatch theme switch)

## Tech Stack
- **Backend:** Python, Django
- **Database:** SQLite (default Django DB)
- **Frontend:** Django Templates + Bootstrap (Bootswatch) + Vanilla JavaScript (Fetch API)

## Project Structure
```text
System-Communication-Dashboard-Django/
  config/
  logs/
  templates/
    base.html
    dashboard.html
  static/
    assets/
      app.js
      styles.css
  manage.py
  requirements.txt

