resource "helm_release" "argocd" {
  name             = "argocd"
  repository       = "https://argoproj.github.io/argo-helm"
  chart            = "argo-cd"
  namespace        = "argocd"
  create_namespace = true

  set {
    name  = "dex.enabled"
    value = false
  }
  set {
    name  = "configs.params.server\\.insecure"
    value = true
  }

  set {
    name  = "server.ingress.enabled"
    value = true
  }

  set {
    name  = "server.ingress.hosts[0]"
    value = "argocd.services.rhoades-brown.local"
  }

  set {
    name  = "server.ingress.ingressClassName"
    value = "nginx"
  }
}

resource "helm_release" "argocdcreds" {
  name      = "argocdcreds"
  chart     = "../../../../../helm/argocreds"
  namespace = "argocd"

  set {
    name  = "encryptedData.password"
    value = var.sealed_password
  }

  set {
    name  = "encryptedData.type"
    value = var.sealed_type
  }

  set {
    name  = "encryptedData.url"
    value = var.sealed_url
  }

  set {
    name  = "encryptedData.username"
    value = var.sealed_username
  }

  set {
    name  = "argocd.setTimestamp"
    value = plantimestamp()
  }

  depends_on = [helm_release.argocd]
}
