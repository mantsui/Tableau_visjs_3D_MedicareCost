
var colors_Setup = {
"Corporate":"#da4480",
"Home Office":"#5ab449",
"Consumer":"#7f5acd",
"Small Business":"#aab740",
"Technology":"#ce58c0",
"Furniture":"#50a26e",
"Office Supplies":"#d1434b"
};


// Initialize the viz variable 
var vizSuperstore;


/* ------------------------------ Part 1: Tableau Section [Start] ------------------------------ */
window.onload= function() {
// When the webpage has loaded, load the viz

	// Declare sheet name for the sheet to pass data to D3.
	var Tableau_Sheet_Name = "Sales by Two Levels";
	// Explicitly define ordered dimensions to D3 hierarchical data conversion.
	var Ordered_Dimension_List_to_D3 = ["Customer Segment", "Product Category"];
	// Define particular Measure from Tableau to go into D3.
	var Measure_Name = "SUM(Sales)";
	var Display_Measure_Name = "Customer Segment";
	
	var placeholder = document.getElementById('mySuperstoreViz');
	var vizURL = 'https://public.tableau.com/views/SuperstoreD3ChordDiagram/SalesDashboardD3Pair';
	var options = {
		width: '1200px',
		height: '720px',
		hideToolbar: true,
		hideTabs: true,
	
		onFirstInteractive: function () {
			// Function call to get tableau data after Tableau visualization is complete.
			Pass_Tableau_Data_to_D3(vizSuperstore, Tableau_Sheet_Name, Ordered_Dimension_List_to_D3, 
						Measure_Name, Display_Measure_Name, 
						Draw_D3_Chord_Diagram); 
															
		}		
	};

	vizSuperstore = new tableau.Viz(placeholder, vizURL, options);

	// Listen for filter change/selection for "Superstore Dashboard D3 Pair"
	vizSuperstore.addEventListener('filterchange', function(filterEvent) {

		filterEvent.getFilterAsync().then( function(filterChangeField){
			if (filterChangeField.getFieldName() === "Customer Segment" || filterChangeField.getFieldName() === "Product Category") {

				// Function call to get tableau data, transform and load to D3 chart generation 
				// after filter change to "Calendar Year" or "APC".
				Pass_Tableau_Data_to_D3(vizSuperstore, Tableau_Sheet_Name, Ordered_Dimension_List_to_D3, 
							Measure_Name, Display_Measure_Name,
							Draw_D3_Chord_Diagram);
			}			
		});
	});
	
};

/* ------------------------------- Part 1: Tableau Section [End] ------------------------------- */


/* ------------------- Part 2: Convert Tableau Data to D3 Matrix Data [Start] ------------------ */

// Import data from target dashboard-worksheet using Tableau Javascript API
// and converting the data into a format for D3 input.
let Pass_Tableau_Data_to_D3 = function(vizName, sheetName, arrayDimensionNames, strMeasureName, strDisplayName, callback){
	
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

	// Get and reformat tableau data for D3 processing 
	sheet.getSummaryDataAsync(options).then(function(TableauData){
			Array_of_Columns = TableauData.getColumns();
			Tableau_Array_of_Array = TableauData.getData();
			//console.log('***** Debug output getData() *****');	// Debug output
			//console.log(Tableau_Array_of_Array);			// Debug output
			//console.log('***** Debug output getColumns() *****');	// Debug output
			//console.log(Array_of_Columns);												// Debug output
			
			/*Convert Tableau data into Array of Objects for D3 processing. */
			var Tableau_Array_of_Objects = ReduceToObjectTablulated(Array_of_Columns, Tableau_Array_of_Array);
			//console.log('***** Display Tableau Array_Of_Objects *****');	// Debug output
			//console.log(Tableau_Array_of_Objects);												// Debug output
			var Tableau_Array_of_Elements = Convert_To_Array_of_Array(Tableau_Array_of_Objects, arrayDimensionNames, strMeasureName, strDisplayName);
			
			var Dimension_Element_List = Dimension_Elements(Tableau_Array_of_Objects, arrayDimensionNames);


			// Verify callback object type is a function to call the draw D3 chart
			if(typeof callback === "function"){
				// Javascript callback function to dynamically draw D3 chart
				callback(Tableau_Array_of_Elements, Dimension_Element_List, colors_Setup);
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
function Convert_To_Array_of_Array(FlatData, arrayDimensionNames, strValueName, strDisplayValue){

	var NestedArray = [];

	FlatData.forEach(function(d){
		var Row_Array = [];
		
		for (var FieldIndex = 0; FieldIndex <= arrayDimensionNames.length; FieldIndex++) {
			if(FieldIndex < arrayDimensionNames.length){
				Row_Array[FieldIndex] = d[arrayDimensionNames[FieldIndex]];				
			}
			else if(FieldIndex === arrayDimensionNames.length){
				Row_Array[FieldIndex] = Math.round( parseFloat( d[strValueName].replace(/,/g,"") ));
			}
		}
		
		NestedArray.push(Row_Array);	
	});
	
	//console.log("*** NestedArray ***");	//Debug output
	//console.log(NestedArray);		//Debug output
		
	return NestedArray;
}

// Obtain list of unique dimension elements
function Dimension_Elements(FlatData, arrayDimensionNames){//Test

	var Dimension_Elements = [];
	var Index = 0;
	
	for (var FieldIndex = 0; FieldIndex < arrayDimensionNames.length; FieldIndex++) {
		
		FlatData.forEach(function(d){
			if( !(Dimension_Elements.includes(d[arrayDimensionNames[FieldIndex]])) ){
				Dimension_Elements[Index] = d[arrayDimensionNames[FieldIndex]];
				Index++;
			}
		});				
	}
	
	//console.log("*** Dimension_Elements ***");	//Debug output
	//console.log(Dimension_Elements);		//Debug output
		
	return Dimension_Elements;
}


/* ------------------- Part 2: Convert Tableau Data to D3 Matrix Data [End] ------------------- */


/* ---------------- Part 3: Draw D3 Chord Diagram (Superstore) Section [Start] ----------------- */
function Draw_D3_Chord_Diagram(InputData, Element_List, Color_List) {

	var D3_innerRadius=220, D3_outerRadius=250;
	var D3_width=630, D3_height=630;

	// Translates the element and its children by x units in the x-axis
	var D3_translate_X=300;
	// Translates the element and its children by y units in the y-axis
	var D3_translate_Y=260;

	function sort(a,b){ return d3.ascending(Element_List.indexOf(a),Element_List.indexOf(b)); }

	var ch = viz.ch().data(InputData)
		    .padding(.01)
		    .sort(sort)
		    .innerRadius(D3_innerRadius)
		    .outerRadius(D3_outerRadius)
		    .duration(1000)
		    .chordOpacity(0.3)
		    .labelPadding(.03)
		    .fill(function(d){ return Color_List[d];});

	//Remove and create svg for chart refreshing
  	d3.select("svg").remove();

	var svg = d3.select("#D3_Chord_Diagram").append("svg")
		    .attr("height",D3_height)
		    .attr("width",D3_width);
	
							
	svg.append("g")
	   .attr("transform", "translate(" + D3_translate_X + "," + D3_translate_Y + ")").call(ch);
		
}

/* ----------------- Part 3: Draw D3 Chord Diagram (Superstore) Section [End] ------------------ */
