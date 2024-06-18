  COMPONENT_NAME=foodie-service
  TIMESTAMP=$(date +%Y%m%d%H%M%S)

#  if [ "$#" -lt 1 ]; then
#    echo "Illegal number of parameters"
#    echo "Usage: ./docker-build.sh <package.json-script-name>"
#
#  else
#    SCRIPTS_NAMES="$*"
    export DOCKER_DEFAULT_PLATFORM=linux/amd64

    PACKAGE_JSON_VERSION=$(grep -o '"version": "[^"]*' package.json | grep -o '[^"]*$')
    echo "Extracted package.json version: ${PACKAGE_JSON_VERSION}"

    VERSION="$PACKAGE_JSON_VERSION-$TIMESTAMP"
    VERSION="$(echo "$VERSION" | sed 's/:/-/g')"

    TAG_NAME="${COMPONENT_NAME}:${VERSION}"

#    if [[ "$(docker manifest inspect ${BASE_IMAGE} > /dev/null ; echo $? )" == 1 ]]; then
        echo "Building image with tag: ${TAG_NAME}"
        docker build -t ${TAG_NAME} --platform linux/amd64 --no-cache .
#        docker push ${BASE_IMAGE}
#    else
#      docker pull --platform linux/amd64 ${BASE_IMAGE}
#    fi

#    echo "Script Name ${SCRIPTS_NAMES} specified to build $VERSION of component $COMPONENT_NAME"
#    docker build  -t ${COMPONENT_NAME}:${VERSION} --progress=plain --no-cache --platform linux/amd64 .

    echo "creating the built docker image ${COMPONENT_NAME}:${VERSION}"
    docker create --name ${COMPONENT_NAME}_${VERSION} --platform linux/amd64 ${COMPONENT_NAME}:${VERSION} .

    echo "Copying artifact from docker's dist folders to the host ${COMPONENT_NAME}:${VERSION}"
#    rm -rf dist webcomponents; mkdir -p dist webcomponents ;
    docker cp ${COMPONENT_NAME}_${VERSION}:/foodie/work/dist/. ./dist/
#    docker cp ${DXP_COMPONENT}_${VERSION}:/Widgets/. ./webcomponents/

    # publishing docker image to registry
    echo "Pushing docker image ${REGISTRY_COMPONENT}:${VERSION}"
#    docker push ${REGISTRY_COMPONENT}:${VERSION}
#    docker tag ${REGISTRY_COMPONENT}:${VERSION} ${REGISTRY_COMPONENT}:latest
#    docker push ${REGISTRY_COMPONENT}:latest

    echo "removing the created docker image ${COMPONENT_NAME}_${VERSION}"
    docker rm ${COMPONENT_NAME}_${VERSION}
    docker image prune  --force

    echo "Removing the image ${COMPONENT_NAME}:${VERSION}"
    docker rmi "${COMPONENT_NAME}:${VERSION}" --force

#  fi
