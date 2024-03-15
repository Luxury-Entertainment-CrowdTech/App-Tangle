#!/bin/bash
export FLASK_ENV=production
gunicorn --daemon -w 4 -b 0.0.0.0:3007 app:app
