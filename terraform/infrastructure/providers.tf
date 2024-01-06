terraform {
  required_providers {
    proxmox = {
      source  = "TheGameProfi/proxmox"
      version = "2.9.16"
    }

    talos = {
      source  = "siderolabs/talos"
      version = "0.4.0-alpha.0"
    }

    helm = {
      source  = "hashicorp/helm"
      version = "2.12.1"
    }

    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "2.24.0"
    }

    local = {
      source  = "hashicorp/local"
      version = "2.4.1"
    }
  }
}

provider "proxmox" {
  pm_api_url = "https://proxmox.rhoades-brown.local:8006/api2/json"
  pm_debug   = true
}

provider "talos" {
  # Configuration options
}

provider "local" {
  # Configuration options
}
