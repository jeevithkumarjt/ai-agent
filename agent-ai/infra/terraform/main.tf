terraform {
  required_version = ">= 1.6"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.29"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.12"
    }
  }
  backend "gcs" {}
}

provider "google" {
  project = var.project_id
  region  = var.region
}

module "gke" {
  source  = "terraform-google-modules/kubernetes-engine/google"
  version = "~> 32.0"

  project_id        = var.project_id
  name              = "agent-ai"
  regional          = true
  region            = var.region
  network           = var.network
  subnetwork        = var.subnetwork
  ip_range_pods     = "pods"
  ip_range_services = "services"

  node_pools = [
    {
      name               = "default"
      machine_type       = "e2-standard-4"
      min_count          = 1
      max_count          = 6
      local_ssd_count    = 0
      disk_size_gb       = 100
      disk_type          = "pd-standard"
      image_type         = "COS_CONTAINERD"
      auto_repair        = true
      auto_upgrade       = true
      service_account    = var.node_service_account
      initial_node_count = 1
    }
  ]
}

provider "kubernetes" {
  host                   = module.gke.endpoint
  token                  = module.gke.token
  cluster_ca_certificate = module.gke.ca_certificate
}

provider "helm" {
  kubernetes {
    host                   = module.gke.endpoint
    token                  = module.gke.token
    cluster_ca_certificate = module.gke.ca_certificate
  }
}

resource "helm_release" "agent_ai" {
  name       = "agent-ai"
  chart      = "../helm/agent-ai"
  depends_on = [module.gke]

  set {
    name  = "ingress.host"
    value = var.ingress_host
  }
  set {
    name  = "secrets.openaiApiKey"
    value = var.openai_api_key
    type  = "string"
  }
  set {
    name  = "external.postgres.host"
    value = var.postgres_host
  }
  set {
    name  = "external.postgres.user"
    value = var.postgres_user
  }
  set {
    name  = "external.postgres.password"
    value = var.postgres_password
    type  = "string"
  }
  set {
    name  = "external.postgres.db"
    value = var.postgres_db
  }
  set {
    name  = "external.qdrant.host"
    value = var.qdrant_host
  }
  set {
    name  = "external.redis.host"
    value = var.redis_host
  }
}
