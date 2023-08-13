# splunk-oncall-migration-from-pagerduty
The purpose of these scripts is to help migrate Pagerduty Escalation Policies and Services to Splunk On-Call. 

## Pre-requisites
These scripts are written in nodejs. Perform the following to run the migration script successfully:
1. Install nodejs on the machine you are running. (https://nodejs.org/en/download)
2. Execute the following command to install the required nodejs modules
```npm install```

## Migrate Pagerduty Escalation Policies to Splunk On-Call
The migrate-ep.js script will read the escalation policies configuration exported via Pagerduty API
