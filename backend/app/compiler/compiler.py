from typing import Dict, Any, List

class WorkflowCompiler:
    @staticmethod
    def compile_graph(automation_id: int, graph: Dict[str, Any]) -> Dict[str, Any]:
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
                        "jsonBody": "{\n  \"execution_id\": \"={{ $json.body.execution_id }}\",\n  \"status\": \"success\",\n  \"output\": {\"reply\": \"" + node_data.get("text", "") + "\"}\n}"
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
                        "values": {
                            "string": [
                                {
                                    "name": node_data.get("variable_name", "key"),
                                    "value": node_data.get("variable_value", "")
                                }
                            ]
                        }
                    },
                    "id": f"n8n-node-{node_id}",
                    "name": f"Store Value Node {node_id}",
                    "type": "n8n-nodes-base.set",
                    "typeVersion": 1,
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
            else:
                n8n_node = {
                    "parameters": {},
                    "id": f"n8n-node-{node_id}",
                    "name": f"NoOp Node {node_id}",
                    "type": "n8n-nodes-base.noOp",
                    "typeVersion": 1,
                    "position": [1250, 300]
                }
            n8n_nodes.append(n8n_node)

        for edge in edges:
            source_id = edge["source"]
            target_id = edge["target"]
            source_node = node_map.get(source_id)
            target_node = node_map.get(target_id)

            if source_node and target_node:
                source_name = f"{source_node.get('type', '').replace('_', ' ').capitalize()} Node {source_id}"
                target_name = f"{target_node.get('type', '').replace('_', ' ').capitalize()} Node {target_id}"

                if source_name not in n8n_connections:
                    n8n_connections[source_name] = {"main": [[]]}

                n8n_connections[source_name]["main"][0].append({
                    "node": target_name,
                    "type": "main",
                    "index": 0
                })

        return {
            "name": f"Compiled Automation Workflow {automation_id}",
            "nodes": n8n_nodes,
            "connections": n8n_connections,
            "settings": {}
        }
