# SubShield Project Status

## Current active app

The active app is `src/subshield/SubShieldComplete.jsx`, imported by `src/App.jsx`.

The older prototype remains in `src/components/SubShield.jsx` as a backup, but it is not used by the running app.

## Current architecture

- `src/subshield/data.js` contains realistic frontend mock data.
- `src/subshield/utils.js` contains storage, scoring, formatting, and package helper logic.
- `src/subshield/styles.css` contains the main design system.
- `src/subshield/debug.css` contains edge-case layout and bug-fix overrides.
- `src/subshield/SubShieldComplete.jsx` contains the active React app.

## What works now

- Policy vault
- Policy details
- Compliance score
- Renewal action
- Rate shopping action
- GC directory
- COI package review modal
- Simulated package send
- Scan/vault modal
- Activity log
- Profile and demo reset
- Local storage persistence

## Next production work

- Add real authentication
- Add real PDF upload and storage
- Add OCR/document extraction
- Add email delivery integration
- Add backend database tables
- Add audit logs
- Add real certificate holder editing
- Add tests
