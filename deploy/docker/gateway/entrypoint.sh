#!/bin/sh
set -eu

# 当前文件：校验运行时 provider 并生成只写入临时目录的 Nginx 配置。
case "${RAY_AI_PROVIDER:-google}" in
  google|gemini)
    RAY_AI_PROVIDER=gemini
    ;;
  openai)
    RAY_AI_PROVIDER=openai
    ;;
  *)
    echo "RAY_AI_PROVIDER must be google, gemini, or openai" >&2
    exit 1
    ;;
esac

export RAY_AI_PROVIDER
envsubst '${RAY_AI_PROVIDER}' < /etc/nginx/nginx.conf.template > /tmp/nginx.conf
exec nginx -c /tmp/nginx.conf -g 'daemon off;'
