// Initialize the viz variable 
var vizMedicareCostStat;


/* ------------------------------ Part 1: Tableau Section [Start] ------------------------------ */
window.onload= function() {
// When the webpage has loaded, load the viz

	// Declare sheet name for the sheet to pass data to D3.
	var Tableau_Sheet_Name = "Hosp Stat Detail visjs Support";
	
	var placeholder = document.getElementById('myMedicareStatViz');
	var vizURL = 'https://public.tableau.com/views/MedicareCostRptProject/VisjsDashboardPair';
	var options = {
		width: '750px',
		height: '670px',
		hideToolbar: true,
		hideTabs: true,
	
		onFirstInteractive: function () {
			// Function call to get tableau data after Tableau visualization is complete.
			Pass_Tableau_Data_to_visjs(vizMedicareCostStat, Tableau_Sheet_Name, drawVisualization);
		}		
	};

	vizMedicareCostStat = new tableau.Viz(placeholder, vizURL, options);

	// Listen for filter change/selection for "Medicare Cost Statistics visjs Dashboard Pair"
	vizMedicareCostStat.addEventListener('filterchange', function(filterEvent) {

		filterEvent.getFilterAsync().then( function(filterChangeField){
			if (filterChangeField.getFieldName() === 'RPT Period' || filterChangeField.getFieldName() === 'State' || filterChangeField.getFieldName() === 'Zip Code Desc') {
				// Function call to get tableau data, transform and load to chart generation 
				// after filter change to "RPT Period" or "State" or "Zip Code Desc".
				Pass_Tableau_Data_to_visjs(vizMedicareCostStat, Tableau_Sheet_Name, drawVisualization);
			}			
		});
	});

	
};

/* ------------------------------- Part 1: Tableau Section [End] ------------------------------- */

/* -------------------- Part 2: Convert Tableau Data to vis.js Data [Start] -------------------- */

// Import data from target dashboard-worksheet using Tableau Javascript API
// and converting the data into a format for vis.js data visualization input.
let Pass_Tableau_Data_to_visjs = function(vizName, sheetName, callback){
	
	var sheet = vizName.getWorkbook().getActiveSheet().getWorksheets().get(sheetName);
	
	var Array_of_Columns;
	var Tableau_Array_of_Array;
	var TableauTreeData;
			
	options = {
		maxRows: 0, // Max rows to return. Use 0 to return all rows
		ignoreAliases: false,
		ignoreSelection: true,
		includeAllColumns: false
	};

	// Get and reformat tableau data for visjs processing 
	sheet.getSummaryDataAsync(options).then(function(TableauData){
			Array_of_Columns = TableauData.getColumns();
			Tableau_Array_of_Array = TableauData.getData();
			//console.log('***** Debug output getData() *****');	// Debug output
			//console.log(Tableau_Array_of_Array);			// Debug output
			//console.log('***** Debug output getColumns() *****');	// Debug output
			//console.log(Array_of_Columns);												// Debug output
			
			/*Convert Tableau data into Array of Objects for visjs processing. */
			var Tableau_Array_of_Objects = ReduceToObjectTablulated(Array_of_Columns, Tableau_Array_of_Array);
			//console.log('***** Display Tableau Array_Of_Objects *****');	// Debug output
			//console.log(Tableau_Array_of_Objects);												// Debug output
					
			var visjsDataInput = Convert_to_visjs_Array_of_Obj(Tableau_Array_of_Objects);

			// Verify callback object type is a function to call the draw chart
			if(typeof callback === "function"){
				// Javascript callback function to dynamically draw chart
				callback(visjsDataInput);
			}
			
	});
	
};


// Tableau .getData() returns an array (rows) of arrays (columns) of objects, 
// which have a formattedValue property.
// Convert and flatten "Array of Arrays" to "Array of objects" in 
// field:values convention for easier data format for D3.
function ReduceToObjectTablulated(cols, data){
	
	var Array_Of_Objects = [];
	
	for (var RowIndex = 0; RowIndex < data.length; RowIndex++) {
		var SingleObject = new Object();
		
		for (var FieldIndex = 0; FieldIndex < Object.keys(data[RowIndex]).length; FieldIndex++) {
			var FieldName = cols[FieldIndex].getFieldName();
			
			SingleObject[FieldName] = data[RowIndex][FieldIndex].formattedValue;

		} // Looping through the object number of properties (aka: Fields) in object
		
		Array_Of_Objects.push(SingleObject);	// Dynamically append object to the array

		//console.log('*****************');	// Debug output
		//console.log(SingleObject);		// Debug output
		//console.log(Array_Of_Objects);	// Debug output
		
	} //Looping through data array of objects.
	
	//console.log('***** Display Array_Of_Objects *****');	// Debug output
	//console.log(Array_Of_Objects);												// Debug output	
	return Array_Of_Objects;
}

// Convert tabulated data into tabulated array of array data
function Convert_to_visjs_Array_of_Obj(FlatData){
	var hash = Object.create(null);
	var groupedArray = [];
	var vis_js_dotSize = 1;
    
	// Grouping up array into unique dimension records (Hospital name, State, Zip Code Desc)
	FlatData.forEach(function (d) {
		var key = ['Hospital Component Name', 'State', 'Zip Code Desc'].map(function (k) { return d[k]; }).join('|');
		
		if (!hash[key]) {
			hash[key] = { State: d['State'], 'Zip Code Desc': d['Zip Code Desc'], "Hospital Component Name": d['Hospital Component Name'], xValueName: 'Inpatient_Discharges', yValueName: 'IP_Days_OP_Visits_Trips', zValueName: 'FTE_Employees', x: '0', y: '0', z: '0', style: vis_js_dotSize };
			groupedArray.push(hash[key]);
		}
	});	

	FlatData.forEach(function (d) {
		groupedArray.forEach(function (o) {
			if ( o['State'] == d['State'] && o['Zip Code Desc'] == d['Zip Code Desc'] && o['Hospital Component Name'] == d['Hospital Component Name']  ) {

				if (d['Measure Names'] == 'Inpatient_Discharges') {
					o.x = parseFloat( d['Measure Values'].replace(/,/g,"") );
				}

				if (d['Measure Names'] == 'IP_Days_OP_Visits_Trips') {
					o.y = parseFloat( d['Measure Values'].replace(/,/g,"") );					
				}

				if (d['Measure Names'] == 'FTE_Employees') {
					o.z = parseFloat( d['Measure Values'].replace(/,/g,"") );					
				}
				
			}
		});
	});
	
	//console.log("groupedArray");	//Debug output
	//console.log(groupedArray);	//Debug output
	return groupedArray;
}

/* --------------------- Part 2: Convert Tableau Data to vis.js Data [End] --------------------- */

/* --------------- Part 3: Supporting Tableau Javascript mark selection [Start] ---------------- */

// Highlight the specified dimension (mark) to the specified value(single)
function setSingleMarkTo(vizName, sheetName, Value_State, Value_Zip_Desc) {
	var sheet = vizName.getWorkbook().getActiveSheet().getWorksheets().get(sheetName);
	sheet.selectMarksAsync( {"State": Value_State, "Zip Code Desc": Value_Zip_Desc}, tableau.SelectionUpdateType.REPLACE);

	//Reset mark selection after 15 seconds delay
	setTimeout(function() { sheet.selectMarksAsync( {"State": "All", "Zip Code Desc": "All"}, tableau.SelectionUpdateType.REPLACE); }, 15000);	
}

/* ---------------- Part 3: Supporting Tableau Javascript mark selection [End] ----------------- */


/* ------- Part 4: Draw visjs 3-D scatterplot (Medicare Cost Statistics) Section [Start] ------- */

// Called when the Visualization API is loaded.
function drawVisualization(inputArray) {
	// create the data table.
	var data = new vis.DataSet();
	
	data.add(inputArray);

	//console.log("*** data ***");	//Debug output
	//console.log(data);		//Debug output
	
	// specify options
	var options = {
		width:  '600px',
		height: '600px',
		style: 'dot-size',
		showPerspective: false,
		showGrid: true,
		
		backgroundColor: '#000000',	// Set background color to black
		gridColor: '#f2f2f2',	// Set grid color to white
		axisColor: '#f2f2f2',	// Set x-axis, y-axis, z-axis colors to white
		dataColor: 'rgba(137, 246, 243, 0.6)',	// Set dot color to light green with 60% opacity

		xLabel: 'Inpatient Discharges',
		yLabel: 'IP Days OP Visits Trips',
		zLabel: 'FTE Employees',
		
		xValueLabel: function(value) {
				return value.toLocaleString();
		},
		yValueLabel: function(value) {
				return value.toLocaleString();
		},
		zValueLabel: function(value) {
				return value.toLocaleString();
		},
		
		keepAspectRatio: false,
		//legendLabel:'value',
		showLegend: false,
		//tooltip: true,
		
		// Option tooltip can be true, false, or a function returning a string with HTML contents
		tooltip: function (point) {
			// parameter point contains properties x, y, z, and data
			// data is the original object passed to the point constructor

			//Tableau mark selection on map sheet
			setSingleMarkTo(vizMedicareCostStat, "Hosp Stat Map visjs Pair", point.data['State'], point.data['Zip Code Desc']);
			
			return '<b><u>' + point.data['Hospital Component Name'] + '</u></b><br>' +
			       'State: ' + point.data['State'] + '<br>' +
			       'Zip Code Desc: ' + point.data['Zip Code Desc'] + '<br><br>' +
			       'FTE Employees: <b>' + point.z.toLocaleString() + '</b><br><br>' +
			       'Inpatient Discharges: <b>' + point.x.toLocaleString() + '</b><br>' +
			       'IP Days OP Visits Trips: <b>' + point.y.toLocaleString() + '</b><br>';
		},

		// Tooltip default styling can be overridden
		tooltipStyle: {
			content: {
				background    : 'rgba(255, 255, 255, 0.8)',
				padding       : '10px',
				borderRadius  : '10px'
			},
			line: {
				borderLeft    : '1px dotted rgba(0, 0, 0, 0.5)'
			},
			dot: {
				border        : '5px solid rgba(0, 0, 0, 0.5)'
			}
		},
		
		verticalRatio: 1.0,
		cameraPosition: {
			horizontal: -0.54,
			vertical: 0.5,
			distance: 1.6
		},
		dotSizeMinFraction: 0.5,
		dotSizeMaxFraction: 2.5
	};

	// create our graph
	var graph = null;
	var container = document.getElementById('mygraph');
	graph = new vis.Graph3d(container, data, options);
}

/* -------- Part 4: Draw visjs 3-D scatterplot (Medicare Cost Statistics) Section [End] -------- */
