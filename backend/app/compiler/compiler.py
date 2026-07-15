from typing import Dict, Any, List

class WorkflowCompiler:
    @staticmethod
    def compile_graph(automation_id: int, graph: Dict[str, Any], name : str = None) -> Dict[str, Any]:
        # Truncate workflow name to satisfy n8n 128-char limit
        name_str = name or f"Compiled Automation Workflow {automation_id}"
        if len(name_str) > 120:
            name_str = name_str[:117] + "..."
            
        nodes = graph.get("nodes", [])

        edges = graph.get("edges", [])

        n8n_nodes = []
        n8n_connections = {}
        node_map = {n["id"]: n for n in nodes}

        for node in nodes:
            node_id = node["id"]
            node_type = node.get("type")
            node_data = node.get("data", {})

            if node_type == "incoming_event":
                n8n_node = {
                    "parameters": {
                        "path": f"trigger-{automation_id}",
                        "options": {}
                    },
                    "id": f"n8n-node-{node_id}",
                    "name": f"Incoming Event Node {node_id}",
                    "type": "n8n-nodes-base.webhook",
                    "typeVersion": 1,
                    "position": [250, 300]
                }
            elif node_type == "if_condition":
                n8n_node = {
                    "parameters": {
                        "conditions": {
                            "string": [
                                {
                                    "value1": "={{ $json.body.message }}",
                                    "operation": node_data.get("operator", "contains"),
                                    "value2": node_data.get("keyword", "")
                                }
                            ]
                        }
                    },
                    "id": f"n8n-node-{node_id}",
                    "name": f"If Node {node_id}",
                    "type": "n8n-nodes-base.if",
                    "typeVersion": 1,
                    "position": [450, 300]
                }
            elif node_type == "send_request":
                n8n_node = {
                    "parameters": {
                        "url": "http://localhost:8000/webhooks/callback",
                        "method": "POST",
                        "sendBody": True,
                        "specifyBody": "json",
                        "jsonBody": "{\n  \"execution_id\": \"={{ $json.body.execution_id }}\",\n  \"status\": \"success\",\n  \"output\": {\n    \"action_type\": \"" + node_data.get("action_type", "reply") + "\",\n    \"reply\": \"" + node_data.get("text", "").replace('"', '\\"') + "\"\n  }\n}"
                    },
                    "id": f"n8n-node-{node_id}",
                    "name": f"Send Request Node {node_id}",
                    "type": "n8n-nodes-base.httpRequest",
                    "typeVersion": 3,
                    "position": [650, 300]
                }

            elif node_type == "store_value":
                n8n_node = {
                    "parameters": {
                        "assignments": {
                            "assignments": [
                                {
                                    "name": node_data.get("variable_name", "key"),
                                    "value": node_data.get("variable_value", ""),
                                    "type": "string"
                                }
                            ]
                        }
                    },
                    "id": f"n8n-node-{node_id}",
                    "name": f"Store Value Node {node_id}",
                    "type": "n8n-nodes-base.set",
                    "typeVersion": 3,
                    "position": [850, 300]
                }
            elif node_type == "delay":
                n8n_node = {
                    "parameters": {
                        "amount": node_data.get("duration", 5),
                        "unit": node_data.get("unit", "minutes")
                    },
                    "id": f"n8n-node-{node_id}",
                    "name": f"Delay Node {node_id}",
                    "type": "n8n-nodes-base.wait",
                    "typeVersion": 1,
                    "position": [1050, 300]
                }
            elif node_type == "generic_api":
                n8n_node = {
                    "parameters": {
                        "url": node_data.get("url", ""),
                        "method": node_data.get("method", "GET"),
                        "sendHeaders": True,
                        "headerParameters": {
                            "parameters": [
                                {"name": h.get("key"), "value": h.get("value")} for h in node_data.get("headers", [])
                            ]
                        },
                        "sendBody": True,
                        "specifyBody": "json",
                        "jsonBody": node_data.get("body", "{}")
                    },
                    "id": f"n8n-node-{node_id}",
                    "name": f"Generic API Node {node_id}",
                    "type": "n8n-nodes-base.httpRequest",
                    "typeVersion": 3,
                    "position": [1700, 300]
                }
            elif node_type == "custom_script":
                n8n_node = {
                    "parameters": {
                        "jsCode": node_data.get("code", "return items;")
                    },
                    "id": f"n8n-node-{node_id}",
                    "name": f"Custom Script Node {node_id}",
                    "type": "n8n-nodes-base.code",
                    "typeVersion": 1,
                    "position": [1900, 300]
                }
            else:
                n8n_node = {
                    "parameters": {},
                    "id": f"n8n-node-{node_id}",
                    "name": f"NoOp Node {node_id}",
                    "type": "n8n-nodes-base.noOp",
                    "typeVersion": 1,
                    "position": [2100, 300]
                }

            n8n_nodes.append(n8n_node)

        def get_node_name(node_type: str, node_id: str) -> str:
            if node_type == "incoming_event":
                return f"Incoming Event Node {node_id}"
            elif node_type == "if_condition":
                return f"If Node {node_id}"
            elif node_type == "send_request":
                return f"Send Request Node {node_id}"
            elif node_type == "store_value":
                return f"Store Value Node {node_id}"
            elif node_type == "delay":
                return f"Delay Node {node_id}"
            elif node_type == "generic_api":
                return f"Generic API Node {node_id}"
            elif node_type == "custom_script":
                return f"Custom Script Node {node_id}"
            else:
                return f"NoOp Node {node_id}"

        for edge in edges:
            source_id = edge["source"]
            target_id = edge["target"]
            source_node = node_map.get(source_id)
            target_node = node_map.get(target_id)

            if source_node and target_node:
                source_name = get_node_name(source_node.get("type"), source_id)
                target_name = get_node_name(target_node.get("type"), target_id)

                if source_name not in n8n_connections:
                    n8n_connections[source_name] = {"main": [[]]}

                n8n_connections[source_name]["main"][0].append({
                    "node": target_name,
                    "type": "main",
                    "index": 0
                })

        return {
            "name":name_str,
            "nodes": n8n_nodes,
            "connections": n8n_connections,
            "settings": {}
        }
