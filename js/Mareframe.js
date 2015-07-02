var MareFrame = MareFrame || {};
MareFrame.DST = MareFrame.DST || {};


MareFrame.DST.Handler = function () {
	var modelArr = [];
	var activeModel;
    this.fileHandler = new MareFrame.DST.FileIO();
    

    console.log("javascript handler");
    this.init = function() {
    	console.log("handler init running");
    	var loadModel = getUrlParameter('model');
    	if (loadModel!==null) {
    		h.fileHandler.QuickLoad(loadModel);
    	} else {
    		this.addNewModel();
    	}
    }

    this.getGUI = function() {
        return gui;
    }
    this.setGUI = function(g) {
	    this.gui = g;
    }

    this.getFileIO = function() {
        return fileHandler;
    }

    this.addNewModel = function () {
    	var mdl = new MareFrame.DST.Model()
    	//modelArr.push(mdl);
    	this.setActiveModel(mdl);
    	h.gui.clear();
		//console.log(mdl)
    	return mdl;
    }

    this.addModel = function(m) {
        modelArr.push(m);
    }

    this.closeModel = function(e) {

    }

    this.setActiveModel = function(m) {
    	activeModel = m;
    	//h.gui.importStage();
    }

    this.getActiveModel = function() {
        return activeModel;
    }

    
}

MareFrame.DST.FileIO = function ()
{
	var LastPath = "";
    this.SaveModel= function (m)
    {
        
    }
    
    this.QuickSave = function ()
    {
    	var m = h.getActiveModel();
    	var json = JSON.stringify(m);
    	localStorage.setItem("temp",json);
    }

    this.QuickLoad = function (model)
    {
    	var path = "";
    	switch(model)
    	{
    		case "baltic":
    			path = "JSON/baltic.json";
    			break;
    		case "blackSea":
    			path = "JSON/blackSea.json";
    			break;
    		case "cadiz":
    			path = "JSON/cadiz.json";
    			break;
    		case "iceland":
    			path = "JSON/iceland.json";
    			break;
    		case "northSea":
    			path = "JSON/northSea.json";
    			break;
    		case "scotland":
    			path = "JSON/scotland.json";
    			break;
    		case "sicily":
    			path = "JSON/sicily.json";
    			break;
    		default:
    			break;
    	}
    	//var jsonMdl = JSON.parse(localStorage.getItem("temp"));
    	//if (jsonMdl) {
    	//	console.log("localstorage not empty");

    	//	var mdl = h.addNewModel();
    	//	mdl.fromJSON(jsonMdl);
    		
    	//}
    	//else {
    	console.log("localstorage empty");
    	console.log(path);
    		jQuery.getJSON(path, function (data) {
    			
    			console.log(data);
    			var mdl = h.addNewModel();
    			mdl.fromJSON(data);
    			h.gui.updateFinalScores();
    		});
    		
    	//}

    }
}

function pause(milliseconds) {
	var dt = new Date();
	while ((new Date()) - dt <= milliseconds) { /* Do nothing */ }
}//borrowed code

function getUrlParameter(sParam) {
	var sPageURL = window.location.search.substring(1);
	var sURLVariables = sPageURL.split('&');
	for (var i = 0; i < sURLVariables.length; i++) {
		var sParameterName = sURLVariables[i].split('=');
		if (sParameterName[0] == sParam) {
			return sParameterName[1];
		}
	}
}//borrowed code



MareFrame.DST.Model = function()
{
    var elementArr = [];
    var connectionArr = [];
    var modelName = "untitled";
    var modelPath = "./";
    var plotArr = [];
    var modelChanged = true;
    var dataMatrix = [];
    var mainObjective;

    this.setMainObj=function(obj)
    {
    	mainObjective = obj;
    }
    this.getMainObj=function()
    {
    	return mainObjective;
    }

    this.getDataMatrix = function () {
    	return dataMatrix;
    }

    this.setDataMatrix = function (mat) {
    	dataMatrix = mat;
    }

    this.getWeights = function (elmt)
    {
    	var weightsArr = [];
    	
    	//traverse down the tree and store the weights for each attrib, normalized to fraction of 1 each level
    	if (elmt.getType() != 0) {
    		var total = 0.0;
    		elmt.getData()[1].forEach(function (val) { total += val; });
    		for (var i = 0; i < elmt.getData()[0].length; i++) {
    			var childWeights = this.getWeights(this.getConnection(elmt.getData()[0][i]).getInput());
    			for (var j = 0; j < childWeights.length; j++)
    			{
    				childWeights[j][1] *= (elmt.getData()[1][i]/total);
    			}
    			weightsArr = weightsArr.concat(childWeights);
    		}
    	} else {
    		weightsArr.push([elmt.getData()[0], 1]);
    	}
    	return weightsArr;
    }

    this.getFinalScore = function () {
    	var tempMatrix = JSON.parse(JSON.stringify(dataMatrix));
    	var weightsArr = this.getWeights(mainObjective);
    	for (var i = 0; i < weightsArr.length; i++)
    	{
    		var currentMax = 0;
    		for (var j = 1; j < tempMatrix.length; j++) {
    			if (tempMatrix[j][i + 1] > currentMax) {
    				currentMax = tempMatrix[j][i + 1];
    			}
    		}
    		
    		for(var j=1;j<tempMatrix.length;j++)
    		{
    			tempMatrix[j][i + 1] = tempMatrix[j][i + 1] / currentMax;
    			tempMatrix[j][i + 1] *= weightsArr[i][1];
    			tempMatrix[j][i + 1] = (Math.round(1000*tempMatrix[j][i + 1]))/1000;
    			
    		}

    	}
    	for (var i = 1; i < tempMatrix.length-1; i++)
    	{
    		tempMatrix[i][0] = this.getElement(tempMatrix[i][0]).getName();
    	}
    	

    	return tempMatrix;
    }

    this.getWeightedData = function (elmt,addHeader) {
    	var tempMatrix = [];
    	if (addHeader) {
    		tempMatrix.push(['string', 'number']);
    	}
    	switch (elmt.getType()) {
    		case 2: //scenario
    			for (var i = 1; i < dataMatrix[0].length; i++) {
    				tempMatrix.push([dataMatrix[0][i], dataMatrix[elmt.getData()[0]][i]]);
    			}
    			break;
    		case 0: //attribute
    			for (var i = 1; i < dataMatrix.length-1; i++) {
    				tempMatrix.push([this.getElement(dataMatrix[i][0]).getName(), dataMatrix[i][elmt.getData()[0]]]);
    			}
    			break;
    		case 1: //sub-objective
    			var total = 0.0;
    			elmt.getData()[1].forEach(function (val) { total += val; });
    			//console.log(total + " : " + elmt.getName());
    			for (var i = 0; i < elmt.getData()[0].length; i++) {
    				//console.log(elmt.getData());
    				var tempEl = this.getConnection(elmt.getData()[0][i]).getInput();
    				
    				var tempArr = this.getWeightedData(tempEl);
    				//console.log(tempArr);


    				var result=0;
    				for (var j = 0; j < tempArr.length; j++) {
    					
    					result += tempArr[j][1];
    					
    				}
    				//console.log(result + " " + elmt.getName()+"; "+tempArr+" "+tempEl.getName());
    				tempMatrix.push([tempEl.getName(), result * (elmt.getData()[1][i] / total)]);
    			}
    			break;
    	}
    	return tempMatrix;
    }


    this.CreateNewElement = function () {
    	var e = new MareFrame.DST.Element();
        elementArr.push(e);
        return e;

    }

    this.getElement = function (id) {
        return elementArr[getElementIndex(id)];
    }

    function getElementIndex(id) {
        var key = 0;
        elementArr.every(function (elm) {
            if (elm.getID() === id)
                return false;
            else {
                key = key + 1;
                return true;
            }
        });
        return key;
    }

    this.getConnections= function()
    {
    	return connectionArr;
    }

    this.getConnection = function(id) {
	    return connectionArr[getConnectionIndex(id)];
    }

    function getConnectionIndex(id) {
    	var key = 0;
    	connectionArr.every(function (conn) {
    		if (conn.getID() === id)
    			return false;
    		else {
    			key = key + 1;
    			return true;
    		}
    	});
    	return key;
    }

    this.getElementArr = function() {
        return elementArr;
    }
    
    this.deleteElement = function (id) {

        h.getActiveModel().getElement(id).deleteAllConnections();

		

	    elementArr.splice(getElementIndex(id), 1);
    }
    
    this.setName = function (n)
    {
        modelName = n;
    }
    
    this.getName = function ()
    {
        return modelName;
    }
    
    this.addConnection = function(c)
    {
    	var validConn = true;
    	connectionArr.forEach(function (conn) {

    		if (conn === c)
    		{ validConn = false; }
    		else if((c.getOutput().getID()===conn.getOutput().getID()&&c.getInput().getID()===conn.getInput().getID())||(c.getOutput().getID()===conn.getInput().getID()&&c.getInput().getID()===conn.getOutput().getID()))
    		{
    			validConn = false;
    		}
    	});
    	if (validConn) {
    		connectionArr.push(c);

    		c.getInput().addConnection(c);
    		c.getOutput().addConnection(c);
    		return true;
    	} else
    	{
    		return false;
    	}
    }

    this.toJSON = function()
    {
    	return {elements:elementArr , connections:connectionArr , mdlName : modelName, mainObj:mainObjective , dataMat:dataMatrix};
    }

    this.fromJSON = function(jsonElmt)
    {
    	$("#modelHeader").html(jsonElmt.mdlName);
    	$("#model_header").append(jsonElmt.mdlName);
    	modelName = jsonElmt.mdlName;


    	dataMatrix = jsonElmt.dataMat;
    	h.gui.updateTable(dataMatrix);
		
    	var maxX = 0;
    	var maxY = 0;

    	jsonElmt.elements.forEach(function (elmt) {
    		var e = h.gui.addElementToStage();
    		e.fromJSON(elmt);
    		h.gui.updateElement(e);
    		if (elmt.posX > maxX)
    			maxX = elmt.posX;

    		if (elmt.posY > maxY)
    			maxY = elmt.posY;

    	});

    	jsonElmt.connections.forEach(function (conn) {
    		var inpt = h.getActiveModel().getElement(conn.connInput);
    		var c = new MareFrame.DST.Connection(inpt, h.getActiveModel().getElement(conn.connOutput));
    		c.fromJSON(conn);
    		if (h.getActiveModel().addConnection(c)) {
    			h.gui.addConnectionToStage(c);
    		}
    	});
    	mainObjective = this.getElement(jsonElmt.mainObj);

    	h.gui.setSize(maxX+80,maxY+20);
    }
}

MareFrame.DST.Element = function ()
{
	var data = [];
	var id = "elmt"+new Date().getTime();
    var name = "Element";
    var description = "write description here";
    var type = 1
    var weightingMethod = 1;
    var connections = [];
    
    this.getData = function ()
    {
        return data;
    }
    this.setData = function (d)
    {
        data = d;
    }
    
    this.getID = function() {
	    return id;
    }
    this.setId = function(i) {
	    id = i;
    }
    this.getName = function ()
    {
        return name;
    }
    this.setName = function (n)
    {
        name = n;
    }
    this.getDescription = function ()
    {
        return description;
    }
    this.setDescription = function (d)
    {
        description = d;
    }
    this.getType = function ()
    {
        return type;
    }
    this.setType = function (t)
    {
        type = t;
    }
    this.getMethod = function () {
    	return weightingMethod;
    }

    this.setMethod = function (i) {
    	weightingMethod = i;
    }


    this.deleteConnection = function (id) {
    	var key = 0;
    	this.connections.every(function (elm) {
    		if (elm.getID() === id)
    			return false;
    		else {
    			key = key + 1;
    			return true;
    		}
    	});
    	connections[key];

    	connections.splice(key, 1);


    }
    this.deleteAllConnections = function () {
    	connections.forEach(function (c) {
    		c.deleteThis(this.id);
    	});

    	connections = [];
    }
    this.addConnection = function (e) {
    	connections.push(e);
    }
    this.getConnections = function () {
    	return connections;
    }
    this.toJSON = function () {
    	
    	return { posX: this.easelElmt.x, posY: this.easelElmt.y, elmtID: this.getID(), elmtName: name, elmtDesc: this.getDescription(), elmtType: this.getType(), elmtData: this.getData(), elmtWghtMthd: this.weightingMethod };
    }
    this.fromJSON = function (jsonElmt) {
    	this.easelElmt.x = jsonElmt.posX;
    	this.easelElmt.y = jsonElmt.posY;
    	this.setID(jsonElmt.elmtID);
    	name = jsonElmt.elmtName;
    	this.setName(jsonElmt.elmtName);
    	this.setDescription(jsonElmt.elmtDesc);
    	this.setType(jsonElmt.elmtType);
    	this.setData(jsonElmt.elmtData);
    	this.setMethod(jsonElmt.elmtWghtMthd);
    }

}





MareFrame.DST.Connection = function (eIn, eOut)
{    
    var inputElement = eIn;
    var outputElement = eOut;
    var id = "conn" + new Date().getTime();

    this.deleteThis = function (calledElement) {
        if (inputElement.getID() === calledElement) {
	        outputElement.deleteConnection(id);
        } else {
	        inputElement.deleteConnection(id);

        }
    }

    this.getID= function()
    {
        return id;
    }

    this.setID= function(i)
    {
        id = i;
    }
           
    this.setInput = function (e)
    {
        inputElement = e;
    }
    
    this.setOutput = function (e)
    {
        outputElement = e;
    }
    
    this.getInput = function ()
    {
        return inputElement;
    }
    
    this.getOutput = function ()
    {
        return outputElement;
    }
    
    this.flip = function ()
    {
        var e = inputElement;
        inputElement = outputElement;
        outputElement = e;

        inputElement.deleteConnection(id);
        outputElement.addConnection(id);
    }

    this.toJSON =function()
    {
    	return { connInput: inputElement.getID(), connOutput: outputElement.getID(), connID: id };
    }

    this.fromJSON = function(jsonElmt)
    {
    	id = jsonElmt.connID;
    }
}


//console.log("model name: " + h.getActiveModel().getName());
//h.getActiveModel().setName("Model");
//console.log("model name: " + h.getActiveModel().getName());


//h.getActiveModel().CreateNewElement();
//h.getActiveModel().CreateNewElement();
//h.getActiveModel().CreateNewElement();

//console.log("Element 2 name: " + h.getActiveModel().getElement(0).getName());
//h.getActiveModel().getElement(1).setName("Test");
//h.getActiveModel().getElement(0).setPosXY([300, 290]);
//h.getActiveModel().getElement(2).setType(2);


//console.log("Element 3 type: " + h.getActiveModel().getElement(2).getType());
//console.log("Element 1 position: " + h.getActiveModel().getElement(0).getPosXY());
//h.getActiveModel().deleteElement(h.getActiveModel().getElement(1));
//console.log("Element 2 name: " + h.getActiveModel().getElement(1).getName());

$(document).ready(function () {

	h = new MareFrame.DST.Handler();
	
	if (MareFrame.DST.GUIHandler) {
		console.log("guihandler found");
		MareFrame.DST.GUIHandler();
		h.init();
	}

	$("#button").bind("click", function (e) {
		
	});
});
