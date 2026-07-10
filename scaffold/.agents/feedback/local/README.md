# local feedback

Use this ignored boundary for secret-free machine-specific agent instructions and feedback that should not enter shared repository history.

Optional local files include `AGENTS.md` and `records/<lifecycle>/*.yaml`. Local instructions may add environment facts and preferences, but they cannot weaken root repository instructions or shared feedback safety, lifecycle, and authority rules.

Promote a useful local observation by sanitizing and generalizing it, removing machine identity and absolute paths, reviewing its safety state, and then creating or updating the matching shared record under `../records/`.
