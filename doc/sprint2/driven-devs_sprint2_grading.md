# Sprint 2 Marking Scheme

**Team Name:** Driven Devs
**Github:** https://github.com/UTSC-CSCC01-Software-Engineering-I/term-group-project-driven-devs

---

## Version Control (max 10 marks)

- Consistent Usage of Git (5 pt):
  - 2 pts: Regular and consistent commits demonstrating incremental progress in the project.
  - 2 pt:  Demonstrated proficiency in basic Git commands (e.g., commit, push, pull, merge) and usage based on the contribution guidelines described by the team in their README.
  - 1 pts: Meaningful commit messages that convey the purpose of each change.

- Branches/Naming/Organization (5 pt)
  - 2 pts: Proper utilization of branches for feature development, bug fixes, etc. Should have feature branches for each user story that differs significantly in logic.
  - 2 pts: Use of Pull Requests and/or avoidance of direct uploads and merging zip files.
     - Should not directly commit each change to the main branch.
     - Should ideally merge branches using pull request feature on GitHub.
     - Should not manually merge zips from different branches in one local repo - bad practice
  - 1 pts: Clear and meaningful branch naming conventions that reflect the purpose of the branch.


Version Control Total Mark: 10 / 10

——

## Code Quality (max 8 marks)

- Proper naming: 1 mark
- Indentation and spacing: 1 mark
- Proper use of comments: 1 mark
- Consistent coding style: 2.5 mark
- Code is easy to modify and re-use: 2.5 mark

Code Quality Total Mark: 6.5 / 8

**Grader's Notes:**
- Overall, the code is structured pretty well, but you should seperate your data access layer from your bussiness logic by putting them in seperate files, making your code more modular and easy to update in the future.

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
- Multiple stories are not broken down into sub-tasks, which should be
  - https://roomzi.atlassian.net/browse/SCRUM-18
    - Frontend, backend, database changes
  - https://roomzi.atlassian.net/browse/SCRUM-46
    - Frontend, backend, database changes
  - and so on...

—
## Project Tracking (max 10 marks)

- Burndown chart is accurate, correctly reflecting tasks completed and remaining.
- The burndown smoothly tracks progress, reflecting team velocity and workload.
- X-axis correctly represents sprint timeline with appropriate intervals.
- Ideal vs. actual progress is clearly represented for comparison.

Deduct 2/2.5 marks for each criteria violated.

If the burndown chart is flat, no marks should be provided

Project Tracking Total Mark: 8 / 10

**Grader's Notes:**
- The burndown chart for sprint 2 was completely flat in the beginning of the sprint, and this is because there were no story points assigned to any story within the sprint until well into the sprint.
  - Please make sure to story point your stories at the *beginning* of the sprint during sprint planning. This is how you decide whether you have too little/too many stories planned for a sprint.

---

## Planning Meetings (RPM.md, sprint1.md) (max 10 marks)

- RPM.md (Release Planning Meetings) (max 5 marks)
  - 5 marks = Release goals are specified and there are sufficient references to included features, excluded features, bug fixes, non-functional requirement, dependency & limitation to be completed during the release
    
Deduct 1 marks for each criteria violated.

Your Mark: 5

- Sprint Planning meeting (sprint2.md) (max 5 marks)
  - 5 marks = Meeting and sprint goal is documented, all spikes clearly identified, team capacity recorded, participants are recorded, everyone has participated, decisions about user stories to be completed this sprint are clear, tasks breakdown is done. 

Deduct 0.5/ 1 marks for each criteria violated.

Your Mark: 5 

Planning Meetings Total Mark: 10 / 10

---

## Team Communication (11 marks)

---

### Daily Stand-ups (max 6 marks)

- Team updates are done on the Slack server within your team's #standup channel
- Standup Format:
    
[Standup Date] - Sprint # Standup #
1. What did you work on since the last standup?
2. What do you commit to next? 
3. When do you think you'll be done?
4. Do you have any blockers?
    
- Each group is required to post a minimum of 6 standups per sprint (Max 6 marks; 1 marks per daily standup)
- Standup updates answers the necessary questions and is good quality
  - 1 marks = All teams members have sent their updates in the channel and are well written/good quality. Each team member consistently addresses the above four questions:

Deduct 0.25 points for each standup point missed up to 1 point in total.
    - For full marks, at least 6 standups need to be present.

Daily Stand-ups Total Mark: 6 / 6

### Sprint Retrospective (max 5 marks)

- 5 marks = Includes a comprehensive review of what went well during the sprint, identifying specific examples of successes and effective practices.
- Proposes practical and realistic actions to address identified challenges and improve future sprints

Deduct 1 points for each criteria violated.

Sprint Retro Total Mark: 5 / 5

Team Communication Mark: 11 / 11

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

Your Mark: 17 / 17

**Grader's Notes:**
1. Maintenance request implemented: once a tenant finalizes the house they want to live in, they can make requests for maintenance features.
  - Tenants can submit requests on houses that they have rented.
    - They can submit images along with their request.
  - Request statuses are tracked and maintained by the application (Pending, In Progress, Rejected)
  - Landlords have notification banners on their page when a new request is made.
2. Rent tracking feature is implemented.
  - Tenants can send a payment request, where they can attach a proof of payment
  - Lanlords can approve or reject these requests.
  - Users can see a history of all previous payments and their statuses
  - Lanlord dashboard tracks monthly income
    - Graphs are broken down by properties that the landlord owns and only shows approved payments
3. Variety of bug fixes.

## Total Mark

79.5 / 84