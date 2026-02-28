# Sprint 3 Marking Scheme

**Team Name:** Driven Devs  
**Github:** https://github.com/UTSC-CSCC01-Software-Engineering-I/term-group-project-driven-devs

---

## Version Control (max 5 marks)

- Consistent Usage of Git (2.5 pt):
  - 1 pts: Regular and consistent commits demonstrating incremental progress in the project.
  - 1 pt:  Demonstrated proficiency in basic Git commands (e.g., commit, push, pull, merge) and usage based on the contribution guidelines described by the team in their README.
  - 0.5 pts: Meaningful commit messages that convey the purpose of each change.

- Branches/Naming/Organization (2.5 pt)
  - 1 pts: Proper utilization of branches for feature development, bug fixes, etc. Should have feature branches for each user story that differs significantly in logic.
  - 1 pts: Use of Pull Requests and/or avoidance of direct uploads and merging zip files.
     - Should not directly commit each change to the main branch.
     - Should ideally merge branches using pull request feature on GitHub.
     - Should not manually merge zips from different branches in one local repo - bad practice
  - 0.5 pts: Clear and meaningful branch naming conventions that reflect the purpose of the branch.

Version Control Total Mark: 5 / 5

——

## Code Quality (max 6 marks)

- Proper naming: 1 mark
- Indentation and spacing: 1 mark
- Proper use of comments: 1 mark
- Consistent coding style: 1.5 mark
- Code is easy to modify and re-use: 1.5 mark

Code Quality Total Mark: 6 / 6

——

## UI Design and Ease of Use (8 marks):
Visual Design/GUI (4 marks):

-	The UI demonstrates a cohesive and visually appealing design with appropriate color schemes, fonts, and visual elements: 1.5 mark
-	Consistent branding and styling are applied throughout the application and creative and thoughtful use of design elements that enhance the overall aesthetics: 1.5 mark
-	Intuitive navigation with clear and logically organized menus, buttons, or tabs: 1 mark
 
Ease of Use (4 marks):

-	Intuitiveness and simplicity in the user interactions, very minimal learning curve: 1.5 mark
-	Interactivity and Responsiveness: 1.5 mark
-	Clear and user-friendly error messages that guide users in resolving issues or success messages: 1 mark

UI Design and Ease of Use Total Mark: 8 / 8

——
## BackLog Management  (10 mark)

- Jira is used proficiently to manage user stories, tasks, and sprints.
- An even distribution of user stories across multiple sprints, not all in one sprint.
- An even distribution of user stories amongst group members.
- Completion and thoughtful organization of the Jira Board and Backlog
- Should use subtask/child issues feature to break down user stories instead of creating a large pool of unclassified tasks/user stories.
- Each user story / task in Sprint 2 has been assigned story estimation points.
- All tasks/user stories in Sprint 2 should be completed.

Note (for TAs): a completed sprint may be hidden from the Backlog/Board.

- You need to find/recover them manually.
- Do not deduct marks for completed sprints, therefore stories that disappeared.

Deduct 1/1.5 marks for each criteria violated.

Backlog Management Total Mark: 9 / 10

**Grader's Notes:**

- There are stories that are large enough to be split up into sub-tasks but they aren't in your JRIA board.
  - For instance, https://roomzi.atlassian.net/browse/SCRUM-78 should be split up into (at least) 1 frontend and 1 backend sub-task in your board.
- 

—

## Project Tracking (max 10 marks)

- Burndown chart is accurate, correctly reflecting tasks completed and remaining.
- The burndown smoothly tracks progress, reflecting team velocity and workload.
- Network diagram to show the critical path and documenting the findings in schedule.pdf
- Ideal vs. actual progress is clearly represented for comparison.

Deduct 2/2.5 marks for each criteria violated.

If the burndown chart is flat, no marks should be provided

Project Tracking Total Mark: 9.5 / 10

**Grader's Notes:**

- The scope of the sprint was not determined prior to its start, resulting in the large spike in the burndown chart late sprint.
  - Because the team was able to identify this as an issue, and proposed solutions to improve upon this in sprint 4, leniency was granted in terms of grading.

---

## Planning Meetings (RPM.md, sprint1.md) (max 5 marks)

### RPM.md (Release Planning Meetings) (max 2.5 marks)

- 2.5 marks = Release goals are specified and there are sufficient references to included features, excluded features, bug fixes, non-functional requirement, dependency & limitation to be completed during the release
    
Deduct 0.5 marks for each criteria violated.
    
Your Mark: 2.5
    
### Sprint Planning meeting (sprint2.md) (max 2.5 marks)

- 2.5 marks = Meeting and sprint goal is documented, all spikes clearly identified, team capacity recorded, participants are recorded, everyone has participated, decisions about user stories to be completed this sprint are clear, tasks breakdown is done. 

Deduct 0.5  marks for each criteria violated.

Your Mark: 2.5 

Planning Meetings Total Mark: 5 / 5

—

---

## Team Communication (5 marks)

---

### Daily Stand-ups (max 3 marks)

- Team updates are done on the Slack server within your team's #standup channel
- Standup Format:
  [Standup Date] - Sprint # Standup #
  1. What did you work on since the last standup?
  2. What do you commit to next? 
  3. When do you think you'll be done?
  4. Do you have any blockers?
- Each group is required to post a minimum of 6 standups per sprint (Max 6 marks; 0.5 marks per daily standup)
- Standup updates answers the necessary questions and is good quality
  - 0.5 marks = All teams members have sent their updates in the channel and are well written/good quality. Each team member consistently addresses the above four questions:

Deduct 0.1 points for each standup missed for up to 0.5 point in total.
- For full marks, at least 6 standups need to be present.

Daily Stand-ups Total Mark: 3 / 3

### Sprint Retrospective (max 2 marks)

 - 2 marks = Includes a comprehensive review of what went well during the sprint, identifying specific examples of successes and effective practices.
  Proposes practical and realistic actions to address identified challenges and improve future sprints

Deduct 0.5 points for each criteria violated.

Sprint Retro Total Mark: 1.5 / 2

**Grader's Notes:**

- In your retro, you have some decisions that did not turn out well, but in your planned changes, you do not address how you will prevent these issues from occurring in the future or how you will change your development process with these in mind.

Team Communication Mark: 4.5 / 5

—

## NFR (max 14 marks)

- Well-structured, follows required format, and placed correctly in doc/sprint3 folder as NFR.pdf (3 marks)
- Clearly explains why the 3 NFRs were prioritized, with strong rationale and categorization, maligning with project needs (3 marks)
- Well-explained (min 2) trade-offs, highlighting benefits and reasoning behind choices. (2 marks)
- Includes detailed test results, best practices, and explanation implementation. 2 marks for each NFR implementation (6 marks)

Deduct marks if NFR are generic and not aligned with project goals and needs
  
NFR Implementation Total Mark: 6 / 14

**Grader's Notes:**

- In your first NFR, when you're talking about the tradeoffs, you switch to second-person POV out of nowhere; not deducting for this, just mentioning that this is strange.
- Overall, in all of your NFRs, you don't explain why you chose to prioritize each NFR, but it seems like you're just explaining why certain tools that you chose to use are good. 
  - This is great, but it doesn't answer the original question, which was provide an NFR and explain why you chose to prioritize it in the context of your application and its users.
- Missing performance testing and security testing results and analysis

—

## Unit Testing (max 12 marks)

- Covers all critical functions and edge cases. (3 marks)
- Tests are well-structured, modular, and maintainable. (3 marks)
- Thoroughly tests edge cases (boundary values, errors) (3 marks)
- Tests run successfully with clear output. (3 marks)

Unit Testing Total Mark: 9 / 12

**Grader's Notes:**
- When running the tests, the following tests failed on my local.
  - Unit tests should run out of the box without any additional setup other than `npm install` as all dependencies not being tested should be mocked.

1. Chat Controller › getUserChats › should return tenant chats successfully
2. Chat Controller › getUserChats › should return landlord chats successfully
3. Listing Controller › getListingById › should return listing by ID successfully

---
## Sprint Demo (Max 17 marks) 

- Attendance (max 2.5 marks)
  - 2.5 marks = full team is present
  - 0.5 mark = one member is not present
  - 0 marks = more than one member is not present

- Working software (max 8 marks)
  - 8 marks = All 2 or 3 features presented work flawlessly
  - 1 mark removed for each bug/error identified or for missing records on JIRA

- UI Presentation (max 4 marks)
  - 4 marks = UI demonstrated is visually appealing and intuitive for users
  - 2 marks = one or more errors identified by the demo TA
  - 0 marks = UI is visually unappealing

- Presentation (max 2.5 marks)
  - 2.5 marks = Overall fluency in demonstrating software, speaking, and presenting ideas and technical
details. Comfortably answers any technical questions asked by TA

**Demo Notes:**
Features Shown:
1. Scheduling and viewing requests with full workflow
  - Users can pick and date and time for a viewing
  - When requests are zubmitted initially, submitters can see their initial request
  - Landlords can then approve, or decline and propose a new time for the requests
2. Create a lease feature.
  - Landlords can create leases with tenants after they have matched with each other
  - After a lease has been created by the landlord, then tenants are given the opportunity to sign the lease.
  - Tenants can sign their leases by re-uploading a signed copy of the lease.
  - Leases can also be renewed on their platform.

Your Mark: 17 / 17

## Total Mark

79 / 92