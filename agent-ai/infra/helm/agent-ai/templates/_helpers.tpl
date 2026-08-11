{{/*
Expand the name of the chart.
*/}}
{{- define "agent-ai.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create chart label.
*/}}
{{- define "agent-ai.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels.
*/}}
{{- define "agent-ai.labels" -}}
helm.sh/chart: {{ include "agent-ai.chart" . }}
{{ include "agent-ai.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels.
*/}}
{{- define "agent-ai.selectorLabels" -}}
app.kubernetes.io/name: {{ include "agent-ai.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}
