#!/bin/sh
# Run from a private DSM scheduled task. This directory also holds the compose file.
set -eu
PATH="/usr/local/bin:/var/packages/ContainerManager/target/usr/bin:$PATH"
cd "$(dirname "$0")"
umask 077
repo=${APP_REPOSITORY:-hoonsw/urlurlurlurl}
case "$repo" in ''|*[!a-z0-9_./-]*|*..*) exit 2;; esac
project=${COMPOSE_PROJECT_NAME:-urlurlurlurl-release}
exec 9>.deployment.lock
flock -n 9 || exit 1
image=$(curl --fail --silent --show-error --location --max-time 45 \
  "https://github.com/$repo/releases/latest/download/image.txt")
digest=${image##*@sha256:}
[ "$image" = "ghcr.io/$repo@sha256:$digest" ] && [ "${#digest}" -eq 64 ] || exit 2
case "$digest" in *[!a-f0-9]*) exit 2;; esac
export APP_IMAGE="$image"
compose() { docker compose -p "$project" -f compose.yaml "$@"; }
current=$(compose ps --all --quiet web)
old_image=''
if [ -n "$current" ]; then
  old_image=$(docker inspect --format '{{.Image}}' "$current")
  reference=$(docker inspect --format '{{.Config.Image}}' "$current")
  health=$(docker inspect --format '{{.State.Health.Status}}' "$current")
  if [ "$reference" = "$image" ] && [ "$health" = healthy ]; then exit 0; fi
fi
docker pull "$image"
if compose up -d --no-build; then
  current=$(compose ps --quiet web)
  attempt=0
  while [ -n "$current" ] && [ "$attempt" -lt 18 ]; do
    health=$(docker inspect --format '{{.State.Health.Status}}' "$current" || true)
    if [ "$health" = healthy ]; then echo "Healthy: $image"; exit 0; fi
    if [ "$health" = unhealthy ]; then break; fi
    attempt=$((attempt + 1))
    sleep 3
  done
fi
if [ -n "$old_image" ]; then
  docker tag "$old_image" "$project-rollback:local"
  APP_IMAGE="$project-rollback:local"
  compose up -d --no-build
  echo "Previous image restored; check its health." >&2
else
  compose stop web
fi
exit 1
