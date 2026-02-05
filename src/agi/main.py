"""
Entry: CLI — read from stdin or args; run loop until halt or max ticks; print response.
--loop: multi-turn REPL (read line, tick, print; exit on empty line or EOF).
--memory PATH: load/save semantic and episodic memory to JSON (working memory not persisted).
"""

import argparse
import sys

from agi.core import Agent, TickInput, tick
from agi.memory import ConcreteStore, load_store, save_store


def _print_output(out) -> None:
    if out.response is not None:
        print(out.response)
    elif out.halt:
        print(out.observation.get("payload", {}).get("text", ""))
    else:
        payload = out.observation.get("payload", {})
        if "content" in payload:
            print(payload["content"])
        elif "entries" in payload:
            print("\n".join(payload.get("entries", [])) or "(empty)")
        else:
            print(payload.get("text", str(out.observation)))


def main() -> None:
    parser = argparse.ArgumentParser(description="AGI — perceive → recall → reason → plan → act → store")
    parser.add_argument("input", nargs="*", help="Input text (or read from stdin)")
    parser.add_argument("--max-ticks", type=int, default=10, help="Max ticks before stopping (default 10)")
    parser.add_argument("--loop", action="store_true", help="Multi-turn REPL: read line, tick, print; exit on empty line")
    parser.add_argument("--memory", metavar="PATH", default=None, help="Load/save semantic+episodic memory to JSON file")
    parser.add_argument("--show-thought", action="store_true", help="Print agent's last thought (working memory) to stderr")
    args = parser.parse_args()

    store = load_store(args.memory) if args.memory else None
    agent = Agent(store=store or ConcreteStore())

    if args.loop:
        try:
            while True:
                line = sys.stdin.readline()
                if not line:
                    break
                raw = line.strip()
                if not raw:
                    break
                inp = TickInput(raw=raw, source="user")
                out = tick(agent, inp)
                if args.show_thought and hasattr(agent.store, "get_working"):
                    thought = agent.store.get_working("last_thought")
                    if thought:
                        print("[thought] %s" % thought, file=sys.stderr)
                _print_output(out)
                if args.memory:
                    save_store(agent.store, args.memory)
        except KeyboardInterrupt:
            pass
        if args.memory:
            save_store(agent.store, args.memory)
        return

    raw = " ".join(args.input).strip()
    if not raw:
        raw = (sys.stdin.read() or "").strip() or "Hello."
    if not raw:
        print("No input.", file=sys.stderr)
        sys.exit(1)

    inp = TickInput(raw=raw, source="user")
    out = tick(agent, inp)
    if args.show_thought and hasattr(agent.store, "get_working"):
        thought = agent.store.get_working("last_thought")
        if thought:
            print("[thought] %s" % thought, file=sys.stderr)
    _print_output(out)
    if args.memory:
        save_store(agent.store, args.memory)


if __name__ == "__main__":
    main()
