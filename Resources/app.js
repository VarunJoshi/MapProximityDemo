var win = Ti.UI.createWindow({
    backgroundColor:'white'
});

win.open();


Ti.Geolocation.purpose = "";
Titanium.Geolocation.getCurrentPosition(function(e)
{
        if (!e.success || e.error)
        {
            currentLocation.text = 'error: ' + JSON.stringify(e.error);
            alert('error ' + JSON.stringify(e.error));
            return;
        }
        currlong = e.coords.longitude;
        currlat = e.coords.latitude;
        var timestamp = e.coords.timestamp;
        currentCoor = currlat + ',' + currlong;
        Ti.API.info('Current Co-ordinates' + currentCoor + ',' + new Date(timestamp));
    
});


var f = Ti.Filesystem.getFile( Ti.Filesystem.applicationSupportDirectory + '/database/mydatabase.sql' );
if ( f.exists() ) {
    alert("Found");
}

var db = Ti.Database.install("db/map.sqlite","mydatabase");



var button = Ti.UI.createButton({
   top:20,
   height:30,
   width:100,
   title:'Click Me',
   backgroundColor:'gray' 
});

win.add(button);


function sortByProximitySearch(rows)
{
    var sRows=new Array();
    
    for(var i = 0 ; i < rows.getRowCount(); i++)
    {   
        sRows[i] = {BussLat:rows.field(0), BussLong:rows.field(1), BussProximity:findProximitySearch(rows.field(0),rows.field(1))};
        Ti.API.info(rows.field(1));
        rows.next();
    }
    sRows.sort(sortByDistanceSearch);
    
    //Sorting algorithm
    for(var i = 0 ; i < sRows.length;i++)
    {   
      Ti.API.info(sRows[i].BussLat+','+ sRows[i].BussLong+','+ sRows[i].BussProximity);
    }
    return sRows;
}



function sortByDistanceSearch(a, b) {
    var x = a.BussProximity;
    var y = b.BussProximity;
    return ((x < y) ? -1 : ((x > y) ? 1 : 0));
}


// haversine algorithm

function findProximitySearch (busLat,busLong)
{
    var reqLat;
    var reqLng;
    
    reqLat =currlat;
    reqLng =currlong;
    
    var R = 6371; // km (mean radius of earth)
    var dLat = (reqLat-busLat)*(22/(7*180));
    var dLon = (reqLng-busLong)*(22/(7*180)); 
    var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(busLat*(22/(7*180))) * Math.cos(reqLat*(22/(7*180))) * 
            Math.sin(dLon/2) * Math.sin(dLon/2); 
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    var d = R * c; // d is the distance in kilometers.
    var mile=d/(1.6);
    mile= Math.round(mile*100)/100;
    Ti.API.info(mile);
    return  mile;
    
}

//declare table view
var tableView = Titanium.UI.createTableView({
    top:40, 
    backgroundColor:'white',
    separatorStyle: Ti.UI.iPhone.TableViewSeparatorStyle.SINGLE_LINE,
    height:290,
    rowHeight:52.5
});

win.add(tableView);

button.addEventListener("click", function(){
    button.hide();
    tableView.setData([]);
    var tableData=[];
    var rows = db.execute("SELECT lat, long from mapview");
    var totalRows;
    totalRows = rows.getRowCount(); 
    Ti.API.info('total rows are'+totalRows);
    sortRows=sortByProximitySearch(rows);
    
    
    // You can modify this to get the required number of nearest centers
    
    for(var i = 0 ; i < sortRows.length;i++)//rows.getRowCount() ; i++)
    {
        var row = Ti.UI.createTableViewRow({
            hasChild:true,
            color:'black',               
            backgroundColor:'white',   
            className:'Search Results',
            businessLat:sortRows[i].BussLat,   
            businessLong: sortRows[i].BussLong, 
            rowHeight:52.5
        });
        
        var label = Ti.UI.createLabel({
            height:'auto',
            width:'auto',
            left:10,
            textAlign:'center',
            font:{fontWeight:'normal',fontSize:'11',fontFamily:'Helvetica Neue'}
        });
        
        ////////////
        // Proximity 
        ////////////
        var lblProximity=Ti.UI.createLabel({
            text:sortRows[i].BussProximity+' miles',
            height:'auto',
            width:'auto',
            right:5,
            textAlign:'center',
            font:{fontWeight:'normal',fontSize:'11',fontFamily:'Helvetica Neue'}
        });
        row.add(label);
        row.add(lblProximity);
        tableData.push(row);
        
        rows.next();
    }
    
    rows.close();
    tableView.setData(tableData);
    db.close();
});
