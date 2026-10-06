# Northwind Security

Sample security content for the demo knowledge base. Northwind is a fictional
company, so nothing here describes a real certification or audit.

## How the product handles data

- Data is encrypted in transit with TLS.
- Data at rest is encrypted in the database.
- Access is role-based. Roles are resolved from the database, not trusted from a
  token alone.
- Passwords are stored as salted hashes, never in plain text.

## Deployment options

- Hosted on Google Cloud Platform, Amazon Web Services or Microsoft Azure.
- Single-tenant deployments are available for Enterprise and Custom plans.

## Customer responsibilities

- Managing user accounts and role assignments.
- Configuring SSO with the customer's own identity provider.
- Deciding how long conversation history is retained.

## Reporting a security issue

Security reports for this repository are handled through the contact details in the
project README. This sample company has no external security contact.
