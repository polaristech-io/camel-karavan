#!/usr/bin/env bash
KAMELETS_DIR="/kamelets"

if  [[ $KAMELETS_GIT_REPOSITORY == https* ]] ;
then
    replacer=https://$KAMELETS_GIT_PASSWORD@
    prefix=https://
    url="${KAMELETS_GIT_REPOSITORY/$prefix/$replacer}"
    git clone --depth 1 --branch ${KAMELETS_GIT_MAIN} $url ${KAMELETS_DIR}
else
    git clone --depth 1 --branch ${KAMELETS_GIT_MAIN} ${KAMELETS_GIT_REPOSITORY} ${KAMELETS_DIR}
fi

CHECKOUT_DIR="/scripts"

if  [[ $PROJECTS_GIT_REPOSITORY == https* ]] ;
then
    replacer=https://$PROJECTS_GIT_PASSWORD@
    prefix=https://
    url="${PROJECTS_GIT_REPOSITORY/$prefix/$replacer}"
    git clone --depth 1 --branch ${PROJECTS_GIT_MAIN} $url ${CHECKOUT_DIR}
else
    git clone --depth 1 --branch ${PROJECTS_GIT_MAIN} ${PROJECTS_GIT_REPOSITORY} ${CHECKOUT_DIR}
fi

cd ${CHECKOUT_DIR}/$(inputs.params.project)

entrypoint -Dcamel.jbang.version=3.18.2 camel@apache/camel export --local-kamelet-dir=${KAMELETS_DIR}

export LAST_COMMIT=$(git rev-parse --short HEAD)
export DATE=$(date '+%Y%m%d%H%M%S')
export TOKEN=$(cat /var/run/secrets/kubernetes.io/serviceaccount/token)
export NAMESPACE=$(cat /var/run/secrets/kubernetes.io/serviceaccount/namespace)

/opt/mvnd/bin/mvnd package \
  -Dquarkus.container-image.build=true \
  -Dquarkus.container-image.push=true \
  -Dquarkus.container-image.insecure=true \
  -Dquarkus.container-image.username=sa \
  -Dquarkus.container-image.password=${TOKEN} \
  -Dquarkus.container-image.registry=${IMAGE_REGISTRY} \
  -Dquarkus.container-image.builder=jib \
  -Dquarkus.kubernetes-client.master-url=kubernetes.default.svc \
  -Dquarkus.kubernetes-client.token=${TOKEN} \
  -Dquarkus.kubernetes.deploy=true \
  -Dquarkus.openshift.deployment-kind=Deployment \
  -Dquarkus.openshift.add-version-to-label-selectors=false \
  -Dquarkus.openshift.labels.\"app.openshift.io/runtime\"=camel \
  -Dquarkus.container-image.group=${NAMESPACE} \
  -Dquarkus.container-image.tag=${DATE}