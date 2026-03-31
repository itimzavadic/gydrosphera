#!/bin/sh
# Локальный просмотр лендинга. После запуска откройте в браузере: http://127.0.0.1:8080
cd "$(dirname "$0")/public" && exec python3 -m http.server 8080
