# Team Builder
***Project-management & Team-assembly SAPUI5 application***

***

## Home dashboard

Upon start-up of the application, the user is presented with a dashboard listing all new, ongoing, finished and canceled projects. General, relevant information about each project is displayed, including the project name, client, timeline, category and language. Additionally, the status of each project is shown in a visual way, using a colored status indicator. The home dashboard allows for the following tasks to be performed:

<img src="https://github.com/pierrerm/TeamBuilderV2/blob/master/photos/photo1.png"/><br>
_Figure 1 - Home dashboard showing project list_<br>


### Search projects
Users can search for specific projects using the ‘live-search’ bar. The latter updates the search results in real-time for each new character typed. Results are ordered in decreasing relevance; all project properties are checked for matches with the search query (eg: not just the project name).

<img src="https://github.com/pierrerm/TeamBuilderV2/blob/master/photos/photo2.png"/><br>
_Figure 2 - Search query 'Con' on project list showing corresponding live results_<br>
 
 <img src="https://github.com/pierrerm/TeamBuilderV2/blob/master/photos/photo3.png"/><br>
_Figure 3 - Search query 'EN' on project list showing corresponding live results_<br>

### Filter projects
Users can group and order projects using specific filters from the Filtering Popup menu. Available filters include Language, Name, Client, Date Started, Date Ended and Category. The user can select a filter then choose to sort results either in ascending or descending order.

<img src="https://github.com/pierrerm/TeamBuilderV2/blob/master/photos/photo4.png"/><br>
_Figure 4 - Filtering Popup menu with 'Date Started' in 'Ascending' order selected_<br>
 
<img src="https://github.com/pierrerm/TeamBuilderV2/blob/master/photos/photo5.png"/><br>
_Figure 5 - Filtered project list (filters: 'Date Started', order: 'Ascending')_<br>

### Cancel/Reactivate Projects
For traceability purposes, projects cannot be deleted altogether, however, they can be canceled. Using intuitive drag-n-drop functionality, projects can be dragged to the cancel button, which will prompt a confirmation message, and change the project status according to its previous status (canceled or active). Projects can also be reordered manually using drag-n-drop functionality.
 
<img src="https://github.com/pierrerm/TeamBuilderV2/blob/master/photos/photo6.png"/><br>
_Figure 6 - Dragging and dropping a project on the cancel/reactivate button_<br>
 
<img src="https://github.com/pierrerm/TeamBuilderV2/blob/master/photos/photo7.png"/><br>
_Figure 7 - Confirmation message, prompted after project has been dropped on button_<br>
 
<img src="https://github.com/pierrerm/TeamBuilderV2/blob/master/photos/photo8.png"/><br>
_Figure 8 - Project status updated, and confirmation message displayed_<br>

### Create new project
Users can create new project using the project creation wizard by clicking on the ‘+’ button. This opens the project creation wizard popup, in which the user is prompted to complete the required fields. The other information required for the project creation are automatically derived from existing data (client information, language, status). Upon confirmation, a success (or failure) message is displayed and the new project appears in the project list.

<img src="https://github.com/pierrerm/TeamBuilderV2/blob/master/photos/photo9.png"/><br>
_Figure 9 - Project creation wizard popup with required information_<br>

<img src="https://github.com/pierrerm/TeamBuilderV2/blob/master/photos/photo10.png"/><br>
_Figure 10 - Updated projects list showing newly-created project and confirmation message_<br>

### Navigate to project details page
Users can navigate to the details page for a specific project by clicking the desired project, this will then call the necessary services to retrieve the relevant data for the project, triggering a slide transition to the details page:
 
<img src="https://github.com/pierrerm/TeamBuilderV2/blob/master/photos/photo11.png"/><br>
_Figure 11 - Slide transition from home dashboard to selected project's detail page_<br>
 
***

## Project details page

Upon navigation to the project details page, the user is presented with a dashboard consisting of a dynamic header displaying essential information pertaining to the project (general Info and team competences), along with the list of employees currently assigned to the project. The project details page allows for the following tasks to be performed:

<img src="https://github.com/pierrerm/TeamBuilderV2/blob/master/photos/photo12.png"/><br>
_Figure 12 - Project details page displaying project info and assigned employees list_<br>

### View employee information
Users can view further information about employees by clicking on the desired employee. This will then open the ‘view employee’ popup, which will display general information about the employee, contact information and individual competences. By clicking on the employee’s email address, a new email will automatically be generated with corresponding recipient and custom greeting.
 
<img src="https://github.com/pierrerm/TeamBuilderV2/blob/master/photos/photo13.png"/><br>
_Figure 13 - View employee popup displaying general, contact and competence information_<br>

<img src="https://github.com/pierrerm/TeamBuilderV2/blob/master/photos/photo14.png"/><br>
_Figure 14 - Automatically generated email with corresponding recipient and custom greeting_<br>

###	Assign employees to project
Users can open the sliding side-panel to display available employees (those not already assigned to the project). From there, users can view additional information about available employees using the afore-mentioned feature. They can then assign employees to the project using intuitive drag-n-drop functionality, by dragging the desired employee to the selected employees list. This will automatically update both lists (available and selected) and will update the competences accordingly.
 
<img src="https://github.com/pierrerm/TeamBuilderV2/blob/master/photos/photo15.png"/><br>
_Figure 15 - Details page with sliding side-panel open_<br>

<img src="https://github.com/pierrerm/TeamBuilderV2/blob/master/photos/photo16.png"/><br>
_Figure 16 - View employee popup displaying general, contact and competence information of available employee_<br>

<img src="https://github.com/pierrerm/TeamBuilderV2/blob/master/photos/photo17.png"/><br>
_Figure 17 - Dragging and dropping available employee to selected employees list_<br>

<img src="https://github.com/pierrerm/TeamBuilderV2/blob/master/photos/photo18.png"/><br>
_Figure 18 - Successful project assignment with confirmation message & updated competences, selected and available lists_<br>

###	Remove employees from project
Users can remove employees that are currently assigned to the project. To do so, three options are available: selecting an employee then clicking the ‘delete’ icon or use intuitive drag-n-drop functionality to drag the desired employee either to the ‘delete’ icon, or to the selected employees list. This will prompt a confirmation from the user through a popup message, after which both lists (available and selected) and the competences will be automatically updated accordingly.
 
<img src="https://github.com/pierrerm/TeamBuilderV2/blob/master/photos/photo19.png"/><br>
_Figure 19 - Removing employee using drag-n-drop to available list_<br>

<img src="https://github.com/pierrerm/TeamBuilderV2/blob/master/photos/photo20.png"/><br>
_Figure 20 - Confirmation message, prompted after employee has been dropped on list_<br>

<img src="https://github.com/pierrerm/TeamBuilderV2/blob/master/photos/photo21.png"/><br>
_Figure 21 - Successful removal with confirmation message & updated competences, selected and available lists_<br>

<img src="https://github.com/pierrerm/TeamBuilderV2/blob/master/photos/photo22.png"/><br>
_Figure 22 - Removing employee using drag-n-drop to 'delete' icon_<br>
 
<img src="https://github.com/pierrerm/TeamBuilderV2/blob/master/photos/photo23.png"/><br>
_Figure 23 - Successful removal with confirmation message & updated competences, selected and available lists_<br>

###	Search & Filter
As for the projects in the home dashboard, the project details page offers a ‘live-search’ bar, along with a filtering popup menu to search through all properties of employees in either the available or the selected employees lists.

###	Additional features
There is also a force refresh button (forces OData service call to read and update the data) along with a share button to automatically generate and share the project details page by email.
