variable "project_id" {
  type        = string
  description = "GCP project id"
}

variable "region" {
  type        = string
  default     = "europe-west1"
}

variable "network" {
  type        = string
  default     = "default"
}

variable "subnetwork" {
  type        = string
  default     = "default"
}

variable "node_service_account" {
  type        = string
  description = "Service account for GKE node pools"
}

variable "ingress_host" {
  type        = string
  description = "Public hostname for the knowledge platform"
}

variable "openai_api_key" {
  type        = string
  sensitive   = true
  description = "OpenAI API key for the LLM gateway"
}

variable "postgres_host" {
  type        = string
  description = "Managed Postgres host"
}

variable "postgres_user" {
  type        = string
  default     = "agentai"
}

variable "postgres_password" {
  type        = string
  sensitive   = true
}

variable "postgres_db" {
  type        = string
  default     = "agentai"
}

variable "qdrant_host" {
  type        = string
  description = "Managed Qdrant host"
}

variable "redis_host" {
  type        = string
  description = "Managed Redis host"
}
