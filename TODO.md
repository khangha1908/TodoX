# TODO: Fix JSON Parse Error in Task Import

## Completed Tasks
- [x] Identify the source of JSON parse error in importTasks function
- [x] Add check for invalid JSON format (e.g., '[object Object]') before JSON.parse
- [x] Provide clearer error message for users when invalid JSON is detected

## Followup Steps
- [ ] Test the import functionality with a valid JSON file to ensure it still works
- [ ] Test the import functionality with an invalid JSON file (containing '[object Object]') to verify the new error message
- [ ] Consider adding more validation for other common invalid JSON formats if needed
