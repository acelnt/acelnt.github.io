var lineRenderer = document.getElementById("lineRenderer");
  var html = document.getElementsByTagName("html")[0];
  //var ctx = canvas.getContext("2d");
  var main = document.getElementById("editor");
  var arrowAdder = document.getElementById("arrowAdder");
  var nodeAdder = document.getElementById("nodeAdder");
  var baseNode = document.getElementById("baseNode");
  var point = document.getElementById("point");
  var nodeContainer = document.getElementById("nodeContainer");
  var baseArrow = document.getElementsByClassName("arrow")[0];
  var nodes = [];
  var nodeReferences = [];
  var mode = 0;
  var unit = 1;
  var pan = {x:0, y:0};
  var dragging = false;
  var Focus = false;
  var middleDownInEditor = false;
  var line = false;
  var titles = 0;
  var mouse_pos = {x:0, y:0};
  var arrowReferences = [];
  var arrows = [];
  var editing = false;
  var optionAdder = document.getElementById("optionAdder");
  var optionEditor = document.getElementById("optionEditor");
  var titleEditor = document.getElementById("titleEditor");
  var bodyEditor = document.getElementById("bodyEditor");
  var baseoptionItem = document.getElementsByClassName("optionItem")[0].cloneNode(true);
  var baseoption = document.getElementsByClassName("option")[0].cloneNode(true);
  var vline = document.getElementsByClassName("vline")[0].cloneNode(true);
  var editorOptions = [];
  var objectified = {};
  var jsonified = "";
  var exportButton = document.getElementById("export");
  var uploadButton = document.getElementById("upload"); 
  var interpreterButton = document.getElementById("Interpreter");
  
  interpreterButton.addEventListener("click", downloadInterpreter);
  nodeAdder.addEventListener("click", newNode);
  arrowAdder.addEventListener("click", newArrow);
  document.addEventListener("mousemove", mouseMove);
  main.addEventListener("click", editorClick);
  document.addEventListener("click", anyClick);
  document.addEventListener("mousedown", mouseDown);
  document.addEventListener("mouseup", mouseUp);
  main.addEventListener("wheel", editorScroll);
  document.addEventListener("keypress", keyPressed);
  optionAdder.addEventListener("click", addOption);
  titleEditor.addEventListener("input", titleEditorChanged);
  bodyEditor.addEventListener("input", bodyEditorChanged);
  exportButton.addEventListener("click", Export);
  uploadButton.addEventListener("change", Uploaded);

function downloadInterpreter() {
  download("main.py")
}

function begin() {
  nodes = [];
  for (i=0; i < nodeReferences.length; i++) {
    nodeReferences[i].parentNode.removeChild(nodeReferences[i]);
  }
  nodeReferences = [];
  mode = 0;
  unit = 1;
  pan = {x:0, y:0};
  dragging = false;
  Focus = false;
  middleDownInEditor = false;
  line = false;
  titles = 0;
  mouse_pos = {x:0, y:0};
  for (i=0; i < arrowReferences.length; i++) {
    arrowReferences[i].parentNode.removeChild(arrowReferences[i]);
  }
  arrowReferences = [];
  arrows = [];
  editing = false;
  editorOptions = [];
  objectified = {};
  jsonified = "";
}

function Uploaded(event) {
  begin();
  importedFile = this.files[0];
  var reader = new FileReader();
  reader.onload = function() {
    var fileContent = JSON.parse(reader.result);
    loadData(fileContent);
  };
  reader.readAsText(importedFile); 
  drawArrows();
  positionNodes();
}

function download(link) {
  var element = document.createElement('a');
  element.setAttribute('href', link);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}

function loadData(data) {
  document.getElementById("FirstText").innerHTML = data.first;
  titles = data.titles;
  pan = data.pan;
  for (var i in data.meta) {
    var nw = baseNode.cloneNode(true);
    nodeReferences.push(nw);
    nodeContainer.appendChild(nw);
    nw.style.display = "flex";
    nw.style.top = data.meta[i].y*unit + "px";
    nw.style.left = data.meta[i].x*unit + "px";
    nw.style.transform = "translateY(-50%) translateX(-50%)";
    nw.getElementsByClassName("nodeTitle")[0].innerHTML = i;
    nw.addEventListener("dblclick", function(event) {
      if (mode == 0) {
        document.getElementById("nodeEdit").style.display = "flex";
        editing = this;
        editorAppearance();
        updateNode(editing);
      }
    });
    nodes.push({x:data.meta[i].x, y:data.meta[i].y, title:i, body:data.meta[i].body, options:data.meta[i].options});
  }
}

function saveData (jsonData, fileName) {
  var a = document.createElement("a"); 
  document.body.appendChild(a); 
  a.style = "display: none"; 
  var blob = new Blob([jsonData], {type: "octet/stream"}), 
  url = window.URL.createObjectURL(blob); 
  a.href = url; 
  a.download = fileName; 
  a.click(); 
  window.URL.revokeObjectURL(url); 
}

function Export() {
  saveData(convertToJson(), "TA.json");
}

function bodyEditorChanged() {
  var node = nodes[nodeReferences.indexOf(editing)];
  node.body = bodyEditor.textContent;
  updateNode(editing);
}

function titleEditorChanged(event) {
  var node = nodes[nodeReferences.indexOf(editing)];
  for (i = 0; i < nodes.length; i++) {
    for (j = 0; j < nodes[i].options.length; j ++) {
      if (nodes[i].options[j].link == node.title) {
        nodes[i].options[j].link = titleEditor.textContent;
      } 
    }
  }
  node.title = titleEditor.textContent;
  
  updateNode(editing);
}

function addOption(event) {
  var node = nodes[nodeReferences.indexOf(editing)];
  node.options.push({link:undefined, logic:"true", phrase:"Option"});
  editorAppearance();
  updateNode(editing);
}

function optionLogicChange(event) {
  var node = nodes[nodeReferences.indexOf(editing)];
  node.options[editorOptions.indexOf(this.parentNode.parentNode)].logic = this.textContent;
  updateNode(editing);
}

function optionPhraseChange(event) {
  var node = nodes[nodeReferences.indexOf(editing)];
  node.options[editorOptions.indexOf(this.parentNode.parentNode)].phrase = this.textContent;
  updateNode(editing);
}

function removeOption(event) {
  var node = nodes[nodeReferences.indexOf(editing)];
  node.options.splice(editorOptions.indexOf(this.parentNode.parentNode), 1);
  updateNode(editing);
  editorAppearance();
}

function editorAppearance() {
  var node = nodes[nodeReferences.indexOf(editing)];
  titleEditor.textContent = node.title;
  bodyEditor.textContent = node.body;
  optionEditor.textContent = "";
  editorOptions = [];
  for (i = 0; i < node.options.length; i++) {
    var newOption = baseoptionItem.cloneNode(true);
    newOption.getElementsByClassName("logic")[0].textContent = node.options[i].logic;
    newOption.getElementsByClassName("logic")[0].addEventListener("input", optionLogicChange);
    newOption.getElementsByClassName("phrase")[0].textContent = node.options[i].phrase;
    newOption.getElementsByClassName("phrase")[0].addEventListener("input", optionPhraseChange);
    newOption.getElementsByClassName("remove")[0].addEventListener("click", removeOption);
    optionEditor.appendChild(newOption);
    editorOptions.push(newOption);
  }
}

function updateNode(ref) {
  var node = nodes[nodeReferences.indexOf(ref)];
  ref.getElementsByClassName("head")[0].getElementsByClassName("nodeTitle")[0].innerHTML = node.title;
  ref.getElementsByClassName("head")[0].getElementsByClassName("nodeBody")[0].innerHTML = node.body;
  ref.getElementsByClassName("tail")[0].innerHTML = "";
  ref.getElementsByClassName("tail")[0].appendChild(vline.cloneNode(true));
  for (i = 0; i < node.options.length; i++) {
    var newOption = baseoption.cloneNode(true);
    newOption.innerHTML = node.options[i].phrase;
    ref.getElementsByClassName("tail")[0].appendChild(newOption);
  }
  drawArrows();
}

function keyPressed(event) {
  if (!editing && !(document.getElementById("FirstText") == document.activeElement)) {
    if (event.key == "Delete" && Focus) {
      if (Focus.classList.contains("node")) {
        var index = nodeReferences.indexOf(Focus);
        pointerKill(nodes[index].title);
        nodes.splice(index, 1);
        Focus.parentNode.removeChild(Focus);
        nodeReferences.splice(index, 1);
        Focus = false;
        drawArrows();
      }
      else if (Focus.classList.contains("arrow")) {
        var index = arrowReferences.indexOf(Focus);
        var option = arrows[index];
        var inNode = nodeReferences.indexOf(option.parentNode.parentNode);
        var optionNumber = Array.prototype.slice.call(option.parentNode.children).indexOf(option) -1;
        nodes[inNode].options[optionNumber].link = undefined;
        Focus = false;
        drawArrows();
      }
    }
    else if (event.key == "n") {
      newNode(event);
    }
    else if (event.key == "a") {
      newArrow(event);
    }
  }
}

function mouseDown(event) {
  if (event.button == 1 && event.target.closest('#editor')) {
    middleDownInEditor = true;
  }
  else if (mode == 0 && event.button == 0 && event.target.closest(".node")) {
    dragging = event.target.closest(".node");
    if (!(event.target.closest(".node") == Focus) && Focus) {
      if (Focus.classList.contains("node")) {
        Focus.classList.remove("node-focused");
      }
      else if (Focus.classList.contains("arrow")) {
        Focus.classList.remove("arrow-focused");
      }
    }
    Focus =  event.target.closest(".node");
    Focus.classList += " node-focused";
  }
  else if (mode == 0 && event.button == 0 && event.target.closest(".arrow")) {
    if (!(event.target.closest(".arrow") == Focus) && Focus) {
      if (Focus.classList.contains("node")) {
        Focus.classList.remove("node-focused");
      }
      else if (Focus.classList.contains("arrow")) {
        Focus.classList.remove("arrow-focused");
      }
    }
    Focus = event.target.closest(".arrow");
    Focus.classList += " arrow-focused";
  }
  if (editing && !event.target.closest('#Station') && !event.target.classList.contains("remove")) {
    document.getElementById("nodeEdit").style.display = "none";
    editing = false;
  }
}

function mouseUp(event) {
  if (event.button == 1) {
    middleDownInEditor = false;
  }
  else if (event.button == 0) {
    dragging = false;
  }
}

function editorScroll(event) {
  var scroll = event.deltaY/3;
  var xadj = event.clientX/unit + pan.x;
  var yadj = event.clientY/unit + pan.y;
  unit *= (2**(-scroll/53));
  html.style.fontSize = unit*100 + "%";
  pan.x = xadj-event.clientX/unit;
  pan.y = yadj-event.clientY/unit;
  nodeContainer.style.left = -pan.x*unit + "px";
  nodeContainer.style.top = -pan.y*unit + "px";
  positionNodes();
  drawArrows();
}

//do things for when mouse moves
function mouseMove(event) {
  //get dot to follow mouse
  mouse_pos = {x:event.clientX, y:event.clientY};
  if (line) {
    drawArrows();
  }
  if (mode == 1 || mode == 2 || mode == 3) {
    point.style.left = event.clientX + "px";
    point.style.top = event.clientY + "px";
  }
  if (middleDownInEditor) {
    panFunc2(event.movementX, event.movementY);
  }
  else if (dragging) {
    dragging.style.left = parseInt(dragging.style.left.split("px")[0]) + event.movementX + "px";
    dragging.style.top = parseInt(dragging.style.top.split("px")[0]) + event.movementY + "px";
    var node = nodes[nodeReferences.indexOf(dragging)];
    node.x += event.movementX/unit;
    node.y += event.movementY/unit;
    drawArrows();
  }
}

function positionNodes() {
  for (i = 0; i < nodeReferences.length; i++) {
    nodeReferences[i].style.transform = "translateY(-50%) translateX(-50%)";
    nodeReferences[i].style.top = (nodes[i].y)*unit + "px";
    nodeReferences[i].style.left = (nodes[i].x)*unit + "px";
  }
}

function panFunc2(x, y) {
  var xadj = x/unit;
  var yadj = y/unit;
  pan.x -= xadj;
  pan.y -= yadj;
  nodeContainer.style.top = -pan.y*unit + "px";
  nodeContainer.style.left = -pan.x*unit + "px";
  drawArrows();
}

/*function panFunc(x, y) {
  var xadj = x/unit
  var yadj = y/unit
  pan.x -= xadj
  pan.y -= yadj
  for (i = 0; i < nodes.length; i++) {
    transforms = nodeReferences[i].style.transform.split(" ")
    if (transforms.length > 2) {
      var prevy = transforms[2].split("(")[1].split(")")[0].split("px")[0]
      var prevx = transforms[3].split("(")[1].split(")")[0].split("px")[0]
      transforms[2] = " translateY(" + (parseInt(prevy) + parseInt(y)) + "px)"
      transforms[3] = " translateX(" + (parseInt(prevx) + parseInt(x)) + "px)"
      nodeReferences[i].style.transform = transforms.join(" ")
    }
    else {
      nodeReferences[i].style.transform += " translateY(" + y + "px)"
      nodeReferences[i].style.transform += " translateX(" + x + "px)"
    }
  }
  drawArrows()
}*/

//if you click anywhere
function anyClick(event) {
  //unactivate the 3d buttons
  var button = event.target.closest('.tdButtons');
  if (!(button && button.id == "nodeAdder") && mode == 1) {
    nodeAdder.classList.remove("tdButtons-active");
    point.style.display = "none";
    mode = 0;
    if (line) {
      mode = 0;
      line = false;
      drawArrows();
    }
  }
  if (!(button && button.id == "arrowAdder") && mode == 2) {
    arrowAdder.classList.remove("tdButtons-active");
    point.style.display = "none";
    if (line) {
      mode = 0;
      line = false;
      drawArrows();
    }
    mode = 0;
  }
  if (!(button && button.id == "arrowAdder") && mode == 3 && !event.target.closest(".node")) {
    arrowAdder.classList.remove("tdButtons-active");
    point.style.display = "none";
    mode = 0;
    line = false;
    drawArrows();
  }
  if (Focus && Focus.classList.contains("node") && !(event.target.closest(".node") == Focus)) {
    Focus.classList.remove("node-focused");
    Focus = false;
  }
  if (Focus && Focus.classList.contains("arrow") && !(event.target.closest(".arrow") == Focus)) {
    Focus.classList.remove("arrow-focused");
    Focus = false;
  }
}

//act on clicks to the editor
function editorClick(event) {
  //add node if in node-adding mode
  if (mode == 1) {
    point.style.display = "none";
    var nw = baseNode.cloneNode(true);
    nodeReferences.push(nw);
    nodeContainer.appendChild(nw);
    var nwx = (event.clientX/unit) + pan.x;
    var nwy = (event.clientY/unit) + pan.y;
    nw.style.display = "flex";
    nw.style.top = event.clientY + pan.y*unit + "px";
    nw.style.left = event.clientX + pan.x*unit +  "px";
    nw.style.transform = "translateY(-50%) translateX(-50%)";
    titles += 1;
    nw.getElementsByClassName("nodeTitle")[0].innerHTML += titles;
    nw.addEventListener("dblclick", function(event) {
      if (mode == 0) {
        document.getElementById("nodeEdit").style.display = "flex";
        editing = this;
        editorAppearance();
        updateNode(editing);
      }
    });
    nodes.push({x:nwx, y:nwy, title:nw.getElementsByClassName("nodeTitle")[0].innerHTML, body:nw.getElementsByClassName("nodeBody")[0].innerHTML, options:[]});
    var options = nw.getElementsByClassName("option");
    for (i = 0; i < options.length; i++) {
      nodes[nodes.length-1].options.push({logic:"true", phrase:options[i].innerHTML, link:undefined});
    }
    drawArrows();
  }
  else if (mode == 2) {
    if (event.target.closest(".option")) {
      line = event.target.closest(".option");
      point.style.boxShadow = "0 0 10px 5px lightgreen";
      mode = 3;
    }
    else {
      arrowAdder.classList.remove("tdButtons-active");
      point.style.display = "none";
      mode = 0;
    }
  }
  else if (mode == 3) {
    if (event.target.closest(".node")) {
      var parentr = line.parentNode.parentNode;
      var pnode = nodes[nodeReferences.indexOf(parentr)];
      var all_options = Array.prototype.slice.call(line.parentNode.getElementsByClassName("option"));
      var number = all_options.indexOf(line);
      pnode.options[number].link = nodes[nodeReferences.indexOf(event.target.closest(".node"))].title;
      arrowAdder.classList.remove("tdButtons-active");
      point.style.display = "none";
      line = false;
      mode = 0;
      drawArrows();
    }
    else {
      arrowAdder.classList.remove("tdButtons-active");
      point.style.display = "none";
      line = false;
      mode = 0;
      drawArrows();
    }
  }
}

function canvas_arrow(context, fromx, fromy, tox, toy, option) {
  if (context + 1 > arrowReferences.length) {
    var nw = baseArrow.cloneNode(true);
    nw.style.display = "flex";
    arrowReferences.push(nw);
    arrows.push();
    main.appendChild(nw);
  }
  var dy = toy-fromy;
  var dx = tox-fromx;
  var angle = Math.atan2(dy, dx) - Math.PI*1.5;
  var length = Math.sqrt(Math.pow(dy, 2) + Math.pow(dx, 2));
  var line = arrowReferences[context];
  arrows[context] = option;
  line.getElementsByClassName("arrowLine")[0].style.height = "0";
  
  line.style.display = "flex";
  line.style.top = toy + "px";
  line.style.left = (tox - line.scrollWidth/2) + "px";
  line.style.transform = "rotate(" + angle + "rad)";
  line.getElementsByClassName("arrowLine")[0].style.height = (length - 48*unit) + "px";
}

function pointerKill(title) {
  for (i = 0; i < nodes.length; i++) {
    for (j = 0; j < nodes[i].options.length; j++) {
      if (nodes[i].options[j].link == title) {
        nodes[i].options[j].link = undefined;
      }
    }
  }
}

function drawArrows() {
  var arrowNumber = 0;
  if (line) {
    var to = nodes.find(function(node) {return node.title == nodes[nodeReferences.indexOf(line.parentNode.parentNode)].title;});
    var fromSide = calculateSides(to, mouse_pos);
    var opt = line;
    var position = opt.getBoundingClientRect();
    var x = position.left;
    var y = position.top;        
    if (fromSide == "left") {
      canvas_arrow(arrowNumber, x, y + opt.scrollHeight/2, mouse_pos.x, mouse_pos.y, line);
    }
    else if (fromSide == "right") {
      canvas_arrow(arrowNumber, x + opt.scrollWidth, y + opt.scrollHeight/2, mouse_pos.x, mouse_pos.y, line);
    }
    else if (fromSide == "top") {
      canvas_arrow(arrowNumber, x + opt.scrollWidth/2, y, mouse_pos.x, mouse_pos.y, line);
    }
    else if (fromSide == "bottom") {
      canvas_arrow(arrowNumber, x + opt.scrollWidth/2, y + opt.scrollHeight, mouse_pos.x, mouse_pos.y, line);
    }
    arrowNumber += 1;
  }
  for (i = 0; i < nodes.length; i++) {
    for (j = 0; j < nodes[i].options.length; j++) {
      if (nodes[i].options[j].link) {
        var to = nodes.find(function(node) {return node.title == nodes[i].options[j].link;});
        if (to) {
          var fromSide = calculateSides(nodes[i], to);
          var opt = nodeReferences[i].getElementsByClassName("option")[j];
          var position = opt.getBoundingClientRect();
          var x = position.left;
          var y = position.top;
          var head = nodeReferences[nodes.indexOf(to)].getElementsByClassName("head")[0];
          var pos = head.getBoundingClientRect();
          var x2 = pos.left;
          var y2 = pos.top;
          if (fromSide == "left") {
            canvas_arrow(arrowNumber, x, y + opt.scrollHeight/2, x2 + head.scrollWidth, y2 + head.scrollHeight/2, opt);
          }
          else if (fromSide == "right") {
            canvas_arrow(arrowNumber, x + opt.scrollWidth, y + opt.scrollHeight/2, x2, y2 + head.scrollHeight/2, opt);
          }
          else if (fromSide == "top") {
            canvas_arrow(arrowNumber, x + opt.scrollWidth/2, y, x2 + head.scrollWidth/2, y2 + head.scrollHeight, opt);
          }
          else if (fromSide == "bottom") {
            canvas_arrow(arrowNumber, x + opt.scrollWidth/2, y + opt.scrollHeight, x2 + head.scrollWidth/2, y2, opt);
          }
          arrowNumber += 1;
        }
      }
    }
  }
  for (i = 0; arrowNumber< arrowReferences.length; arrowNumber++) {
    arrowReferences[arrowNumber].style.display = "none";
  }
}

function calculateSides(from, to) {
  if (Math.abs(from.x - to.x) < 160) {
    if (from.y - to.y > 0) {
      return "top";
    }
    else {
      return "bottom";
    }
  }
  else {
    if (from.x - to.x > 0) {
      return "left";
    }
    else {
      return "right";
    }
  }
}

function newArrow(event) {
  mode = 2;
  nodeAdder.classList.remove("tdButtons-active");
  if (line) {
    line = false;
    drawArrows();
  }
  point.style.left = mouse_pos.x + "px";
  point.style.top = mouse_pos.y + "px";
  point.style.display = "flex";
  point.style.boxShadow = "0 0 10px 5px orange";
  arrowAdder.classList += " tdButtons-active";
}

//set mode to adding node
function newNode(event) {
  mode = 1;
  arrowAdder.classList.remove("tdButtons-active");
  if (line) {
    line = false;
    drawArrows();
  }
  point.style.left = mouse_pos.x + "px";
  point.style.top = mouse_pos.y + "px";
  point.style.display = "flex";
  point.style.boxShadow = "0 0 10px 5px cyan";
  nodeAdder.classList += " tdButtons-active";
}

function convertToJson() {
  objectified.first = document.getElementById("FirstText").innerHTML;
  objectified.meta = {};
  objectified.nodes = {};
  objectified.titles = titles;
  objectified.pan = pan;
  for (let i=0; i<nodes.length; i++) {
    objectified.meta[nodes[i].title] = {x:nodes[i].x, y:nodes[i].y, body:nodes[i].body, options:nodes[i].options};
    objectified.nodes[nodes[i].title] = {body: {}, options: {}};
    for (j=0; j<nodes[i].options.length; j++) {
      var option = nodes[i].options[j];
      objectified.nodes[nodes[i].title].options[option.phrase] = {link:option.link, logic: ""};
      var logic = option.logic;
      var parsed = layerParse(logic);
      objectified.nodes[nodes[i].title].options[option.phrase].logic = parsed;
    }
    var bodySplit = nodes[i].body.split("|");
    var parsedBody = [];
    for (j=0; j < bodySplit.length; j++) {
      parsedBody.push(layerParse(bodySplit[j]));
    }
    objectified.nodes[nodes[i].title].body = parsedBody;
  }
  return JSON.stringify(objectified);
}

function layerParse(text) {
  var broken = breakBrackets(text);
  if (!broken) {
    return text;
  }
  var decommaed = breakCommas(broken[1]);
  var obj = {};
  obj[broken[0]] = decommaed;
  for (i = 0; i < obj[broken[0]].length; i++) {
    obj[broken[0]][i] = layerParse(obj[broken[0]][i]);
  }
  return obj;
}

function breakBrackets(text) {
  var firstBrkt = text.indexOf("(");
  var lastBrkt = text.lastIndexOf(")");
  if (firstBrkt == -1) {
    return false;
  }
  var first = text.substring(0, firstBrkt).trim();
  var mid = text.substring(firstBrkt + 1, lastBrkt);
  return [first, mid];
}

function breakCommas(text) {
  var depth = 0;
  var breakPoints = [-1];
  var notes = [];
  for (i = 0; i < text.length; i++) {
    if (text[i] == "," && depth == 0) {
      breakPoints.push(i);
    }
    if (text[i] == "(") {
      depth += 1;
    }
    if (text[i] == ")") {
      depth -= 1;
    }
  }
  if (breakPoints.length == 1) {
    return [text.trim()];
  }
  else {
    for (i = 1; i < breakPoints.length; i++) {
      notes.push(text.substring(breakPoints[i-1] + 1, breakPoints[i]).trim());
    }
    notes.push(text.substring(breakPoints[breakPoints.length-1] + 1).trim());
    return notes;
  }
}