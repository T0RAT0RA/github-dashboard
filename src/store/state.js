const state = {
    gh: null,
    user: {
        id: null,
        token: '7fe4374588132d43ab7662b40ce1707f373418a1',
        login: null,
    },
    protection_policies: {
        enforce_admins: {
            path: 'enforce_admins.enabled',
            type: 'boolean',
        },
        required_pull_request_reviews: {
            path: 'required_pull_request_reviews.dismiss_stale_reviews',
            type: 'array',
        },
        required_pull_request_reviews:  {
            path: 'required_pull_request_reviews.dismiss_stale_reviews',
            type: 'boolean',
        },
        require_code_owner_reviews:  {
            path: 'required_pull_request_reviews.require_code_owner_reviews',
            type: 'boolean',
        },
    },
    config: {},
    configs: {
        example: {
          repositories: [
            "webapp",
            "php-config",
            "api.*"
          ],
          default_branch: "develop",
          protected_branches: [
            "develop",
            "master"
          ],
          protection: {
            required_pull_request_reviews: true,
            dismiss_stale_reviews: true,
            require_code_owner_reviews: true,
            enforce_admins: false
          },
          labels: [
            {
              name: "Code Reviewed",
              color: "0e8a16"
            },
            {
              name: "Feature Reviewed",
              color: "0e8a16"
            },
            {
              name: "No Tests Approved",
              color: "0052cc"
            },
            {
              name: "Not ready to be merged",
              color: "e11d21"
            },
            {
              name: "Performance Optimization",
              color: "bfd4f2"
            },
            {
              name: "Ready for review",
              color: "c2e0c6"
            },
            {
              name: "Rebase Needed",
              color: "f9d0c4"
            },
            {
              name: "Tests Needed",
              color: "eb6420"
            },
            {
              name: "Waiting API PR",
              color: "e11d21"
            },
            {
              name: "Work In Progress",
              color: "fbca04"
            }
          ]
        }
    },
};

export default state;
