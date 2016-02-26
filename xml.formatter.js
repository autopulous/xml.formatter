'use strict';

var url, rootNode;

var formattedXmlDocument;
var formattedNodes;
var nodeTableOfContents;

var nodeCount, elementCount, attributeCount, textCount, documentCount;

function formatXml() {
    document.getElementById("elementTable").innerHTML = "";

    url = document.getElementById("url").value;
    rootNode = document.getElementById("root").value;

    formattedXmlDocument = "";
    formattedNodes = "";
    nodeTableOfContents = "";

    nodeCount = 0;
    elementCount = 0;
    attributeCount = 0;
    textCount = 0;
    documentCount = 0;

    autopulous.xml.handler = {};

    autopulous.xml.handler.node = function (node) {
        if (autopulous.xml.nodeTypes.ELEMENT == node.nodeType || autopulous.xml.nodeTypes.ATTRIBUTE == node.nodeType || autopulous.xml.nodeTypes.TEXT == node.nodeType || autopulous.xml.nodeTypes.DOCUMENT == node.nodeType) {
            nodeCount++;
        }
    };

    autopulous.xml.handler.element = function (node) {
        elementCount++;
        formattedNodes += elementMetadata(node);
    };

    autopulous.xml.handler.attribute = function (node) {
        attributeCount++;
        formattedNodes += elementMetadata(node);
    };

    autopulous.xml.handler.text = function (node) {
        textCount++;
        formattedNodes += elementMetadata(node);
    };

    autopulous.xml.handler.document = function (node) {
        documentCount++;
        formattedNodes += elementMetadata(node);
    };

    autopulous.xml.handler.result = function (result) {
        var elementTable = document.getElementById("elementTable");

        if (200 == result.xmlHttpStatus) {
            formattedXmlDocument = "<table>";
            formattedXmlDocument += documentMetadata(result.response);
            formattedXmlDocument += "</table>";

            formattedXmlDocument += "<table>";
            formattedXmlDocument += formattedNodes;
            formattedXmlDocument += "</table>";

            formattedXmlDocument += "<h2>Node Map</h2>";

            formattedXmlDocument += "<table>";
            formattedXmlDocument += nodeTableOfContents;
            formattedXmlDocument += "</table>";

            elementTable.innerHTML = formattedXmlDocument;
        }
        else {
            elementTable.innerHTML = "Error: " + result.xmlHttpStatus;
        }
    };

    var retrieveNodeArguments = ("" == rootNode.trim()) ? [] : rootNode.split(",");
    retrieveNodeArguments.unshift(url);

    autopulous.xml.load.apply(this, retrieveNodeArguments);
}

function documentMetadata(xmlDocument) {
    var documentMetadata = "";

    documentMetadata += "<tr class=\"source\"><td>URL</td><td>" + url + "</td></tr>";
    documentMetadata += "<tr class=\"document\"><td>baseURI</td><td>" + xmlDocument.baseURI + "</td></tr>";
    documentMetadata += "<tr class=\"document\"><td>Document nodes</td><td>" + documentCount + "</td></tr>";
    documentMetadata += "<tr class=\"document\"><td>Element nodes</td><td>" + elementCount + "</td></tr>";
    documentMetadata += "<tr class=\"document\"><td>Attribute nodes</td><td>" + attributeCount + "</td></tr>";
    documentMetadata += "<tr class=\"document\"><td>Text nodes</td><td>" + textCount + "</td></tr>";
    documentMetadata += "<tr class=\"document\"><td>Other nodes</td><td>" + (nodeCount - (documentCount + elementCount + attributeCount + textCount)) + "</td></tr>";
    documentMetadata += "<tr class=\"document\"><td>Total nodes</td><td>" + nodeCount + "</td></tr>";

    documentMetadata += "<tr class=\"separator\"><td></td><td></td></tr>";

    return documentMetadata;
}

function elementMetadata(node) {
    var parentNode = autopulous.xml.getParent(node);

    var elementMetadata = "";

    if (autopulous.xml.isTextualNodeType(node)) {
        elementMetadata += "<tr class=\"anchor\" id=\"" + addPath(parentNode, node) + "\"><td></td><td></td></tr>";
    }
    else {
        elementMetadata += "<tr class=\"anchor\" id=\"" + addPath(node) + "\"><td></td><td></td></tr>";
    }

    elementMetadata += "<tr class=\"element\"><td>nodeType</td><td>" + node.nodeType + " {" + autopulous.xml.nodeTypeNames[node.nodeType] + "}</td></tr>";
    elementMetadata += null != node.localName ? "<tr class=\"element\"><td>localName</td><td>" + node.localName + "</td></tr>" : "";
    elementMetadata += "undefined" != typeof node.tagName ? "<tr class=\"element\"><td>tagName</td><td>" + node.tagName + "</td></tr>" : "";

    if (autopulous.xml.isTextualNodeType(node)) {
        if (autopulous.xml.nodeTypes.ATTRIBUTE == node.nodeType) {
            elementMetadata += "<tr class=\"attribute\"><td>nodeName</td><td>" + node.nodeName + "</a></td></tr>";
        }
        else {
            elementMetadata += "<tr class=\"text\"><td>nodeName</td><td>" + node.nodeName + "</a></td></tr>";
        }
    }
    else {
        elementMetadata += "<tr class=\"element\"><td>nodeName</td><td>" + node.nodeName + "</a></td></tr>";

        if (null != parentNode) {
            if (autopulous.xml.hasMultipleInstances(node)) {
                elementMetadata += "<tr class=\"element\"><td><i>node ordinal</i></td><td>" + autopulous.xml.getInstanceOrdinal(node) + " of " + (parentNode.getElementsByTagName(node.localName).length) + "</td></tr>";
            }
        }
    }

    elementMetadata += null != node.prefix ? "<tr class=\"element\"><td>prefix</td><td>" + node.prefix + "</td></tr>" : "";
    elementMetadata += "undefined" != typeof node.namespaceURI ? "<tr class=\"element\"><td>namespaceURI</td><td>" + node.namespaceURI + "</td></tr>" : "";
    elementMetadata += null != node.ownerDocument ? "<tr class=\"element\"><td>ownerDocument</td><td><a href=\"#" + nodeAnchor(node.ownerDocument) + "\">" + node.ownerDocument.nodeName + "</a></td></tr>" : "";

    elementMetadata += autopulous.xml.isTextualNodeType(node) ? "<tr class=\"text\"><td>textContent</td><td><i>\"" + autopulous.xml.getValue(node) + "\"</i></td></tr>" : "";

    elementMetadata += null != parentNode ? "<tr class=\"parent\"><td>parentNode</td><td><a href=\"#" + nodeAnchor(parentNode) + "\">" + parentNode.nodeName + (autopulous.xml.hasMultipleInstances(parentNode) ? "[" + autopulous.xml.getInstanceOrdinal(parentNode) + "]" : "") + "</a></td></tr>" : "";

    elementMetadata += siblings(node);
    elementMetadata += children(node);
    elementMetadata += attributes(node);

    elementMetadata += "<tr class=\"separator\"><td></td><td></td></tr>";

    return elementMetadata;
}

function siblings(node) {
    var siblingList = "";

    if (null != node) {
        var parentNode = node.parentNode;

        if (null != parentNode && 0 < parentNode.childNodes.length) {
            var childList = buildChildList(parentNode, node);

            if ("<td><table></table></td>" != childList) {
                siblingList += "<tr class=\"sibling\">";
                siblingList += "<td><i>Siblings</i></td>";

                siblingList += childList;

                siblingList += "</tr>";
            }
        }
    }

    return siblingList;
}

function children(node) {
    var childList = "";

    if (null != node && 0 < node.childNodes.length) {
        childList += "<tr class=\"child\">";
        childList += "<td><i>Children</i></td>";

        childList += buildChildList(node);

        childList += "</tr>";
    }

    return childList;
}

function attributes(node) {
    var attributeList = "";
    var attributes = node.attributes;

    if (null != attributes && 0 < attributes.length) {
        attributeList += "<tr class=\"attribute\">";
        attributeList += "<td><i>Attributes</i></td>";
        attributeList += "<td>";
        attributeList += "<table>";

        for (var attributeIndex = 0; attributes.length > attributeIndex; attributeIndex++) {
            var attribute = attributes.item(attributeIndex);

            attributeList += "<tr>";
            attributeList += "<td><a href=\"#" + nodeAnchor(node, attribute) + "\">" + attribute.nodeName + "</a></td>";
            attributeList += "<td><i>\"" + autopulous.xml.getValue(attribute) + "\"</i></td>";
            attributeList += "</tr>";
        }

        attributeList += "</table>";
        attributeList += "</td>";
        attributeList += "</tr>";
    }

    return attributeList;
}

function buildChildList(node, selfNode) {
    var childList = "";

    childList += "<td>";
    childList += "<table>";

    var childIndex;
    var childNode;

    // Non-Text nodes at the beginning of the list of children

    for (childIndex = 0; node.childNodes.length > childIndex; childIndex++) {
        childNode = node.childNodes[childIndex];

        if (autopulous.xml.nodeTypes.TEXT != childNode.nodeType && selfNode != childNode) {
            childList += "<tr>";

            childList += "<td><a href=\"#" + nodeAnchor(childNode) + "\">" + childNode.nodeName + (autopulous.xml.hasMultipleInstances(childNode) ? "[" + autopulous.xml.getInstanceOrdinal(childNode) + "]" : "") + "</a></td>";
            childList += "<td></td>";

            childList += "</tr>";
        }
    }

    // Text nodes at the end of the list of children

    for (childIndex = 0; node.childNodes.length > childIndex; childIndex++) {
        childNode = node.childNodes[childIndex];

        if (selfNode != childNode) {
            if (autopulous.xml.isTextualNodeType(childNode)) {
                childList += "<tr>";

                childList += "<td><a href=\"#" + nodeAnchor(childNode) + "\">" + childNode.nodeName + "</a></td>";
                childList += "<td><i>\"" + autopulous.xml.getValue(childNode) + "\"</i></td>";

                childList += "</tr>";
            }
        }
    }

    childList += "</table>";
    childList += "</td>";

    return childList;
}

function addPath(node, textNode) {
    var anchor = nodeAnchor(node, textNode);

    if ("" != anchor) {
        nodeTableOfContents += "<tr class=\"" + ("undefined" != typeof textNode ? (autopulous.xml.nodeTypes.ATTRIBUTE == textNode.nodeType ? "attribute" : "text") : "element") + "\">";
        nodeTableOfContents += "<td><a href=\"#" + anchor + "\">" + nodePath(node, textNode) + "</a></td>";
        nodeTableOfContents += "</tr>";
    }

    return anchor;
}

function nodeAnchor(node, textNode) {
    var anchor = "";
    var nodeDelimiter = "";

    if (null != node) {
        for (; null != node; node = node.parentNode) {
            anchor = node.nodeName + (autopulous.xml.nodeTypes.TEXT != node.nodeType ? ":" + autopulous.xml.getInstanceOrdinal(node) + nodeDelimiter : "") + anchor;
            nodeDelimiter = ".";
        }

        if (null != textNode) {
            anchor += nodeDelimiter + textNode.nodeName;
        }
    }

    return anchor;
}

function nodePath(node, attribute) {
    var path = "";

    if (null != node) {
        for (; null != node; node = node.parentNode) {
            path = autopulous.xml.nodeTypes.TEXT == node.nodeType ? node.nodeName + "" : ("undefined" == typeof node.localName ? node.nodeName : node.localName) + (autopulous.xml.hasMultipleInstances(node) ? "[" + autopulous.xml.getInstanceOrdinal(node) + "]" : "") + " " + path;
        }

        if ("undefined" != typeof attribute) {
            path += attribute.nodeName;
        }
    }

    return path;
}