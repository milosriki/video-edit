import os
import asyncio
from typing import Dict, Any, List, Optional

# Lazy imports for MCP
try:
    from mcp import ClientSession, StdioServerParameters
    from mcp.client.stdio import stdio_client
    MCP_AVAILABLE = True
except ImportError:
    MCP_AVAILABLE = False
    print("⚠️ MCP not installed. Install with: pip install mcp")


class MetaAdsMCPClient:
    """
    MCP Client for Meta Ads Server.
    Connects to an external MCP server that provides Meta Ads tools.
    """
    def __init__(self):
        self.session: Optional[Any] = None
        self.exit_stack: Optional[Any] = None
        self._connected = False
        
        if MCP_AVAILABLE:
            self.server_params = StdioServerParameters(
                command="python3",
                args=["backend_core/run_mcp_server.py"],
                env={
                    **os.environ,
                    "META_APP_ID": os.getenv("META_APP_ID", ""),
                    "META_APP_SECRET": os.getenv("META_APP_SECRET", ""),
                    "META_ACCESS_TOKEN": os.getenv("META_ACCESS_TOKEN", ""),
                    "META_AD_ACCOUNT_ID": os.getenv("META_AD_ACCOUNT_ID", "")
                }
            )
        else:
            self.server_params = None

    async def connect(self) -> bool:
        """Establishes the connection to the MCP server."""
        if not MCP_AVAILABLE:
            print("❌ MCP Client: MCP library not available")
            return False
            
        try:
            # We use the context manager manually to keep the session open
            from contextlib import AsyncExitStack
            self.exit_stack = AsyncExitStack()
            
            read, write = await self.exit_stack.enter_async_context(
                stdio_client(self.server_params)
            )
            self.session = await self.exit_stack.enter_async_context(
                ClientSession(read, write)
            )
            await self.session.initialize()
            self._connected = True
            print("✅ MCP Client: Connected to Meta Ads Server")
            return True
        except Exception as e:
            print(f"❌ MCP Client Connection Error: {e}")
            return False

    async def list_tools(self) -> List[Any]:
        """Lists available tools from the MCP server."""
        if not self.session:
            return []
        result = await self.session.list_tools()
        return result.tools

    async def call_tool(self, name: str, arguments: dict) -> Any:
        """Calls a specific tool on the MCP server."""
        if not self.session:
            raise Exception("MCP Session not connected")
        
        result = await self.session.call_tool(name, arguments)
        return result.content

    async def close(self):
        """Closes the connection."""
        if self.exit_stack:
            await self.exit_stack.aclose()
            self._connected = False
            print("🔌 MCP Client: Disconnected")
    
    @property
    def is_connected(self) -> bool:
        return self._connected


# Singleton instance
meta_ads_client = MetaAdsMCPClient()
