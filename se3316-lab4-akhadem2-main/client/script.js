document.getElementById('searchBtn').addEventListener('click', getSuperHeroTable);
document.getElementById('showID').addEventListener('click', displayListsIDs)
document.getElementById('createList').addEventListener('click', createList)
document.getElementById('showInfo').addEventListener('click', displayListsInfo)
document.getElementById('deleteList').addEventListener('click',deleteList)
document.getElementById('publisher').addEventListener('click',showPublishers)



let sortDirections = {}; // Object to store sort directions for each column


let isDisplayed = false; // Add a flag to track the display state

async function showPublishers(){
    const results = document.getElementById("publisherresults");

    if (isDisplayed) {
        // If the publishers are currently displayed, hide them
        results.style.display = "none";
        isDisplayed = false;
    } else {
        try {
            const response = await fetch('/api/superheroinfo/publishers');

            if (response.status === 200) {// if publishers are found
                const publishers = await response.json();// await json reponce
                // Display the publishers in the 'results' element
                results.style.display = "block"; // make the display viewable
                results.appendChild(document.createTextNode(publishers.join(', '))); // add the publishers
                isDisplayed = true; // changes variable
            } else if (response.status === 404) { // if publishers not found tell user
                results.appendChild.createTextNode('Publishers not found!');
            } else {
                console.error(`Failed to retrieve publishers: ${response.status}`); // if publishers not found send error
            }
        } catch (error) {
            console.error('An error occurred:', error); // catch any errors
        }
    }
}
//deletes a list from the main list of lists
async function deleteList(){
    const name = document.getElementById("searchList").value;// gets the list name
    const regex = /^[\p{L}\s-]+$/u;// allows any language for list name
    if(name && regex.test(name) && name.length < 20){// input validation
        try {
            const response = await fetch(`/api/superheroinfo/list/${name}`, {//fetches delete in backend
                method: 'DELETE', // Specify the method
            });

            if (response.status === 200) {// if delete occured ok
                const data = await response.json();
                alert(`Successfully deleted ${name} List`)// alert the user successfully deleted
            } else if (response.status === 400) { // if delete failed
                const errorData = await response.json();
                alert(errorData.error);// send error to user
            } else {
                console.error(`Failed to delete list: ${response.status}`); // if error occured then send error to user
            }
        } catch (error) {
            console.error('An error occurred:', error); // catch errors
        }
    }else{
        alert("Please only letters when trying to delete a list and make sure list name is less than 20 characters")
    }
}
function getSuperHeroTable() {
    const category = document.getElementById("category").value; // gets desired category
    const search = document.getElementById("search").value;// gets search
    const regex = /^[\p{L}\p{N}\s-]+$/u; // regex to allow any letter from any language and numbers for ben 10
    const regexnum = /^(800|[1-7][0-9]{0,2}|[0-9][0-9]{0,1})$/; // regex to only allow numbers

    const number = document.getElementById("number").value; //gets num of searches


    if(search && category != "id" && category != "idpower" ){ //case for race, name, power, publisher
        if(regex.test(search) &&search.length < 30){
            fetch(`/api/superheroinfo/search?field=${category}&pattern=${search}&n=${number}`) // runs backend search
            .then(response => response.json())
            .then(data => {
                const results = document.getElementById('results'); // where results will display
                results.textContent = ''; // Clear the previous results (no user input so innerhmtl is fine)

                // Create a table
                const table = document.createElement('table');// table

                // Create table header
                const thead = document.createElement('thead');//creation of table pieces
                const headerRow = document.createElement('tr');
                Object.keys(data[0]).forEach((key,index) => {// parses through the keys of data
                    const th = document.createElement('th');
                    th.appendChild(document.createTextNode(key));// adds each key to a header
                    if(key == "name"||key == "Race"||key == "Publisher"){// sorting for name race and publisher
                        th.addEventListener('click', () => { // adds sort function and direction to each header
                            sortDirections[index] = !sortDirections[index]; // Toggle sort direction
                            sortTable(table, index, sortDirections[index]);
                        });
                    }
                    
                    headerRow.appendChild(th);// adds headers to header row
                });
                thead.appendChild(headerRow);// adds header row to header of table
                table.appendChild(thead);// adds header of table to table

                // Create table body
                const tbody = document.createElement('tbody');// creates the table body
                data.forEach(superhero => {
                    const row = document.createElement('tr');// new row
                    Object.values(superhero).forEach(value => {
                        const td = document.createElement('td');
                        td.appendChild(document.createTextNode(value));// adds values to each column of row
                        row.appendChild(td);// adds colomns to rows
                    });
                    tbody.appendChild(row);// adds row to body
                });
                table.appendChild(tbody);// adds body to table

                // Append the table to the results div
                results.appendChild(table);
            });
        }
        else{
            alert("Please only enter Numbers for ID and letters/numbers for anything else. Make sure the number of searches is a number only")

        }
        
    } else if(category == "idpower") {// if the category is searching by Id and viewing powers
        while (results.firstChild) {
            results.removeChild(results.firstChild);// clears table on each run
        }
        if(regexnum.test(search) &&search.length < 4){
            fetch(`/api/superheroinfo/${search}/powers`)
        .then(response => response.json())  
        .then(data => {
            const results = document.getElementById('results');
            let table = document.createElement('table');
            let row = document.createElement('tr');
            let th = document.createElement('th');// creates a vertical table with headers on side for better view
            let td = document.createElement('td');
            th.appendChild(document.createTextNode('Name'));// creates name header
            td.appendChild(document.createTextNode(data.hero_names));// adds hero name to name box
            row.appendChild(th);
            row.appendChild(td);// adds to row
            table.appendChild(row);// adds row to table
            for (let power in data) {
                if (data[power] === 'True' && power !== 'hero_names') {// find all the powers that are true for hero
                    let row = document.createElement('tr');
                    let th = document.createElement('th');
                    let td = document.createElement('td');
                    th.appendChild(document.createTextNode(power));// creates header for each true power
                    td.appendChild(document.createTextNode(data[power])); // fills in true values
                    row.appendChild(th);
                    row.appendChild(td);// adds everything to table
                    table.appendChild(row);
                }
            }
            
            results.appendChild(table);// adds table to results display
        })
        .catch(error => console.error('Error:', error));// catches errors
        }else{
            alert("Please only enter Numbers for ID and letters/numbers for anything else. Make sure the number of searches is a number only")

        }
        
    }
    else if (category == "id"){// case for when searching for superhero by ID
        if(regexnum.test(search) && search.length <4 ){
            fetch(`/api/superheroinfo/${search}`)// run backend function to find superhero by id
            .then(response => {
                if (!response.ok) {// if responce fails then throw error
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(superheroinfosingle => {
                const results = document.getElementById('results');
                results.textContent = "" // clear space for table
                const table = document.createElement('table');
                const row1 = document.createElement('tr');
    
                for (const key in superheroinfosingle) {
                    const cellKey = document.createElement('th');
                    cellKey.appendChild(document.createTextNode(key)); // maps the keys of information to the headers of table
                    row1.appendChild(cellKey);
                }
                table.appendChild(row1);// add row to table
    
                const row2 = document.createElement('tr');// create new row
    
                for (const key in superheroinfosingle){
                    const cellValue = document.createElement('td');// maps the values to the keys to the colomns in the table
                    cellValue.appendChild(document.createTextNode(superheroinfosingle[key]));
                    row2.appendChild(cellValue);// adds values to row
                }
                table.appendChild(row2);// add row to table
    
                results.appendChild(table);// add table to view
            })
            .catch(e => {
                console.log('There was a problem with the fetch operation: ' + e.message);// catch errors
            });
        }else{
            alert("Please only enter Numbers for ID and letters/numbers for anything else. Make sure the number of searches is a number only")

        }
        
    }
    else {// if input validation fails
        alert("Please only enter Numbers for ID and letters/numbers for anything else. Make sure the number of searches is a number only")
    }
}

function sortTable(table, colIndex, asc) {// another sort table function for sorting the search table
    const rows = Array.from(table.rows).slice(1); // Get all rows, excluding the header
    rows.sort((rowA, rowB) => rowA.cells[colIndex].textContent.localeCompare(rowB.cells[colIndex].textContent) * (asc ? -1 : 1));// sorting functionality allowing for accessending and descending sorting
    rows.forEach(row => table.tBodies[0].appendChild(row)); // Re-add rows to table in sorted order
}



async function displayListsIDs() {// function to display the List ids
    const name = document.getElementById("searchList").value;// get name of list
    const regex = /^[\p{L}\s-]+$/u;
    if (name && regex.test(name) && name.length < 20) { // input validation
        try {
            const response = await fetch(`/api/superheroinfo/list/${name}`);// run backend function for finding list ids

            if (response.status === 200) { // if function occured fine
                const data = await response.json();
                displayList(data);// run display list function with the data
            } else if (response.status === 400) {// if function failed in backend
                const errorData = await response.json();
                alert(errorData.error);// alert user with error
            } else {//if function occurs other error
                console.error(`Failed to retrieve list information: ${response.status}`);// alert user with error
            }
        } catch (error) {// catch errors
            console.error('An error occurred:', error);
        }
    }else{// if input validation fails
        alert("Please only enter letters and enter a word that is less than 20 characters")
    }

}


function displayList(data) {// function to display list ids
    const ListResults = document.getElementById("listDisplay");
    ListResults.textContent = ''; // Clear any previous list information

    if (data.superHeroID.length === 0) {// if the length is zero for the ids then the list is empty
        ListResults.textContent = 'List is empty';
    } else {// if there are ids to be used
        const title = document.createElement('h3');
        title.appendChild(document.createTextNode('Superhero IDs in the List:'));
        ListResults.appendChild(title);// creates title and adds it to results

        const list = document.createElement('ul');
        data.superHeroID.forEach(id => {// creates unordered list and adds id value for each part of list
            const item = document.createElement('li');
            item.appendChild(document.createTextNode(id));// create node with id
            list.appendChild(item);
        });

        ListResults.appendChild(list);// adds list to view
    }
}



function sortPowers(index, table, ascending=true) {
    let rows = table.rows;
    for (let i = 1; i < rows.length; i++) {
        let cell = rows[i].getElementsByTagName("TD")[index]; // gets the power cell for each row
        // Split the powers by comma and sort them
        let powers = cell.textContent.split(',').sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
        if (!ascending) { // if ascendng is true
            powers.reverse();//reverse order
        }
        // Join the sorted powers back together
        cell.textContent = powers.join(','); // add the powers back
    }
}
let ascending = true; // Variable to toggle between ascending and descending



async function displayListsInfo() {// display lists and find information for superheros based off ids
    const name = document.getElementById("searchList").value;// gets list name
    const regex = /^[\p{L}\s-]+$/u;

    if (name && regex.test(name) && name.length < 20) {// input validation
        try {
            const response = await fetch(`/api/superheroinfo/list/${name}/information`);// runs backend function to find info
            
            if (response.ok) {// if function runs ok
                const data = await response.json();

                // Build and display the superhero info
                const superheroListDetails = document.getElementById("listDisplay");
                superheroListDetails.textContent = ''; // Clear previous details

                if (data.length > 0) {// if data exists
                    const table = document.createElement('table');
                    const headerRow = document.createElement('tr');
                    const headers = ['Name', 'Gender', 'Race', 'Publisher', 'Powers']; // these are the headers of table
                    headers.forEach((header,index) => {
                        const th = document.createElement('th');  
                        th.appendChild(document.createTextNode(header)); // creates headers with key values are headers 
                        if (header == 'Powers')  {
                            th.addEventListener('click', () => { // event listener to sort each seperate power
                                sortPowers(index, table, ascending);
                                ascending = !ascending; 
                            });
                        }else{
                            th.addEventListener('click', () => sortTableNew(index, table)); // allows sorting for headers                
                        }

                        headerRow.appendChild(th);
                    });
                    table.appendChild(headerRow);// adds headers to table

                    data.forEach(superhero => {
                        const row = document.createElement('tr');// new row
                        let powers = ' '
                        for(let power in superhero.powers){
                            if(superhero.powers[power] == "True"){
                                powers += `${power}, `;// lists the true powers for each super hero
                            }
                        }
                        powers = powers.slice(0, -2); //removes last comma and space
                        const cells = [superhero.name, superhero.Gender, superhero.Race, superhero.Publisher, powers]; // cell headers
                        cells.forEach(cell => {
                            const td = document.createElement('td');
                            td.appendChild(document.createTextNode(cell));// ads information to each cell of table
                            row.appendChild(td);
                        });
                        table.appendChild(row);// adds data rows to table
                    });
                    const title = document.createElement('h3');
                    title.textContent = 'Superheroes information in the List:';
                    superheroListDetails.appendChild(title);// adds title to view
                    superheroListDetails.appendChild(table);// adds table to view
                } 
                else {// if superheros cannot be found
                    superheroListDetails.textContent = 'No superheroes found in the list. Cannot provide information';
                }
            }  else if (response.status === 400) {//if cant find list
                const errorData = await response.json();
                alert(errorData.error);//send error to user
            }
            else {
                console.error(`Superhero info failed to retrieve: ${response.status}`);// if failed to retrieve information let user know
            }
        } catch (error) {// cacthes errors
            console.error('An error occurred while retrieving superhero information:', error);
        }
    }else{// if input validation fails
        alert("Please only enter letters and you must enter a word that is less than 20 characters")
    }
}

function sortTableNew(n, tables) { // function to sort list information table
    var table, rows, switching, i, x, y, shouldSwitch, dir, switchcount = 0; // add needed variables
    table = tables// sets table equal to table variable
    switching = true;// switch variable to handle off and on of decending/acccessnding sorting
    dir = "asc"; 
    while (switching) { // while switching is true
        switching = false;//turns switching to false while loop runs
        rows = table.rows;
        for (i = 1; i < (rows.length - 1); i++) {
            shouldSwitch = false; // turns should switch to false
            x = rows[i].getElementsByTagName("TD")[n];// first value
            y = rows[i + 1].getElementsByTagName("TD")[n];// value infront of first value
            if (dir == "asc") {// case for ascending sorting
                if (x.textContent.toLowerCase() > y.textContent.toLowerCase()) {// sorts in accessending fashion
                    shouldSwitch = true; // allows switching back
                    break;
                }
            } else if (dir == "desc") {// case for descending sorting
                if (x.textContent.toLowerCase() < y.textContent.toLowerCase()) {// sorts opposite way
                    shouldSwitch = true;// allows switching back
                    break;
                }
            }
        }
        if (shouldSwitch) {// once switched you are allowed to switch directions again
            rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);//moves rows
            switching = true;// allows to switch back
            switchcount ++;  // increases the count of the switches
        } else {
            if (switchcount == 0 && dir == "asc") { // on second run
                dir = "desc";// changes direction
                switching = true; //allows switching
            }
        }
    }
}




async function createList() { //creates a new list with a name and super hero id values

    const name = document.getElementById("ListName").value; //gets the user entered name of the list
    const regex = /^[\p{L}\s-]+$/u;// allows letters of all languages
    function isOnlyNumbers(arr) {//function to check that ids are only numbers
        return arr.every(item => Number.isFinite(Number(item)));
    }
    const idstring = document.getElementById("ListIDs").value;
    const Ids = document.getElementById("ListIDs").value.split(",").map(id => id.trim()).map(Number);//trims the id and splits it into array of ids
    if (name && Ids.length > 0 && regex.test(name) && isOnlyNumbers(Ids) &&name.length < 30  && idstring.length > 0) {//input validation
        try {
            
            const post = await fetch('/api/superheroinfo/list/', { //creates a new list
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name: name }), // the name in the body of post request
            });
            if (post.ok) { //if post occured correctly go onto put
                const put = await fetch('/api/superheroinfo/list/' + name, { //adds the ids to the list by using name
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ superHeroID: Ids }), //the ids of the superheros are in body
                });
                if (put.ok) { //if correctly put then send message into console to show success
                    const data = await put.json();
                    alert(data.message)
                } else {
                    console.error('Failed to add superheroes to the list:', updateResponse.status); // if put failed then tell user
                }
            } else {
                console.error('List failed to be created:', createResponse.status); // if post failed then tell user
            }

        }
        catch (error) {
            console.error('Error occured while creating the list:', error) // catch any errors
        }
    }
    else {
        alert('Make sure your list name is only letters. Make sure your IDs are in the form 1,2,3,4....');// if input validation fails then tell user
    }
}