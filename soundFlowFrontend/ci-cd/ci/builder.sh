#!/bin/sh

echo "Connect to Gitlab Registry" 
echo "$INOVSHOP_REGISTRY_PASSWORD" | docker login -u "$INOVSHOP_REGISTRY_USER" "$CI_REGISTRY" --password-stdin

echo "> Building tag '$IMG_TAG'"
if docker build --no-cache -t registry.gitlab.com/supertec-alpha/b2b/b2b-backend:${IMG_TAG} \
  --build-arg BUILD_DATE="$(date +'%F %T')" \
  --build-arg BUILD_BRANCH="$CI_COMMIT_REF_NAME" \
  --build-arg BUILD_COMMIT="$CI_COMMIT_SHA" \
  -f ./docker/Dockerfile . ;then
  echo "> Pushing tag '$IMG_TAG'"
  docker push registry.gitlab.com/supertec-alpha/b2b/b2b-backend:${IMG_TAG}
  echo "> Cleaning up"
  docker rmi registry.gitlab.com/supertec-alpha/b2b/b2b-backend:${IMG_TAG} 2> /dev/null || exit 0
else
  echo "build failed"
  exit 1
fi
