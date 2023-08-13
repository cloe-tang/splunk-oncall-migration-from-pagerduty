// Import Libs
const fs = require("fs");
const util = require("util");
const helper = require("./helper");

// Set PagerDuty's "escalation_policies" Export (file in JSON)
const fileName = `<<Pagerduty EP Exported Config>>.json`;
let onboardTeam = `<<Team to onboard>>`;

(async () => {
  const fileContent = await fs.readFileSync(fileName);
  const parsedFileContent = JSON.parse(fileContent);
  const newPolicyAry = [];

  for (const team of parsedFileContent) {

    // Go to the next record if not the intended team
    if (team.summary != onboardTeam) {
      continue;
    }

    // Exit Program if No Escalation Policies Detected
    if (
      !team.escalation_policies ||
      team.escalation_policies.length === 0
    ) {
      return false;
    }


    // Main
    const teamMapping = await helper.getTeamMapping(); // Get Team Mapping from Splunk
    let newTeamSlug;
    for (const policy of team.escalation_policies) {
      let newPolicy = {
        name: policy.name,
        ignoreCustomPagingPolicies: false,
        steps: [],
      };
      // Process - "teamSlug"
      if (policy.teams.length >= 1) {
        // @NOTE: Always default to first index of the array
        newTeamSlug = teamMapping[policy.teams[0].summary];
        newPolicy.teamSlug = newTeamSlug;
      }
      // Process - "steps"
      if (policy.escalation_rules && policy.escalation_rules.length > 0) {
        let isFirst = true;
        let nextStepTimeout = 0;
        for (const rule of policy.escalation_rules) {
          let newStep = {};
          // Check for the first rule in the escalation policy
          if (isFirst) {
            newStep = {
              // Round timeout to the nearest multipler of 5
              timeout: 0,
              entries: [],
            };
            nextStepTimeout = rule.escalation_delay_in_minutes;
            isFirst = false;
          } else {
            newStep = {
              // Round timeout to the nearest multipler of 5
              timeout: Math.round(nextStepTimeout / 5) * 5,
              entries: [],
            };
            nextStepTimeout = rule.escalation_delay_in_minutes;
          }
          for (const target of rule.targets) {
            let newType = target.type;
            if (target.type === "schedule_reference") {
              newType = "rotation_group";
            } else if (target.type === "user_reference") {
              newType = "user";
            }
            // Get Splunk's Rotation Group Slug
            const rotationGroupSlug = await helper.getRotationSlug(
              newTeamSlug,
              target.summary
            );

            let newEntry = {};
            if (newType === "user") {
              const getUsername = await helper.getUsername(target.id);
              newEntry = {
                executionType: newType,
                user: {
                  username: getUsername,
                },
              };
            } else {
              newEntry = {
                executionType: newType,
                rotationGroup: {
                  slug: rotationGroupSlug,
                },
              };
            }

            newStep.entries.push(newEntry);
          }
          newPolicy.steps.push(newStep);
        }
      }
      newPolicyAry.push(newPolicy);
    }
  }

  // Remove Default Policy to prevent creating it in Splunk
  let removalIndex = null;
  for (const [i, p] of newPolicyAry.entries()) {
    if (p.name === "Default") {
      removalIndex = i;
      break;
    }
  }
  if (removalIndex && removalIndex >= 0) {
    newPolicyAry.splice(removalIndex, 1);
  }

  // Create Policy in Splunk
  console.log("Starting process to create escalation policies in Splunk...");
  console.log(
    `Creating a total of ${newPolicyAry.length} policies in Splunk...`
  );
  console.log(`=========================================`);

  for (const [i, p] of newPolicyAry.entries()) {
    console.log(`Creating ${i + 1}/${newPolicyAry.length} Policy...`);
    let escalationPolicySlug = await helper.getEscalationPolicySlug(
      p.name,
      p.teamSlug
    );
    if (escalationPolicySlug == false) {
      const createPolicyResult = await helper.createPolicy(p);
      if (createPolicyResult) {
        console.log(
          `Successfully created policy with slug: ${createPolicyResult.slug}`
        );
      } else {
        console.log(`Failed to create policy. See error below:`);
        console.log(createPolicyResult);
      }
    } else {
      console.log(`Failed to create policy. Policy already exist.`);
    }
  } 
})();
