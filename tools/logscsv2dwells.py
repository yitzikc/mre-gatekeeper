#!/usr/bin/env python3

import argparse
import pandas as pd


def match_entrances_and_exits(entrances_and_exits: pd.DataFrame) -> pd.DataFrame:
    entrances = entrances_and_exits[entrances_and_exits.decision != "parting"].rename(
        columns={"time": "arrived"})
    exits = entrances_and_exits[entrances_and_exits.decision == "parting"].drop(
        columns=["decision", "arrival"]).rename(
        columns={"time": "departed"})
    dwells = pd.merge_asof(
        entrances, exits, by=["guid"], left_on=["arrived"], right_on=["departed"], suffixes=["_arrived", "_departed"], direction="forward")
    dwells["duration"] = dwells["departed"] - dwells["arrived"]
    dwells = dwells.rename(
        columns={"name_arrived": "name"})[[
            "arrived", "departed", "decision", "arrival", "duration", "name", "guid", "name_departed"
        ]]
    return dwells


def load_entrances_and_exits(csv_path: str) -> pd.DataFrame:
    st = pd.StringDtype()
    entrances_and_exits = pd.read_csv(csv_path, parse_dates=["time"], dtype={
        "decision": st,
        "arrival": st,
        "name": st,
        "guid": st,
    })
    return entrances_and_exits


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=
            "Match entrances and exits of users in a CSV file produced by applogs2csv.ts")
    parser.add_argument("in_file",  type=str,
        help="A CSV file produced by applogs2csv.ts")
    parser.add_argument("out_file", type=str,
        help="A CSV file name for the result")
    args = parser.parse_args()
    return args


def main():
    args = parse_args()
    entrances_and_exits = load_entrances_and_exits(args.in_file)
    dwells = match_entrances_and_exits(entrances_and_exits)
    dwells.to_csv(args.out_file, index=False)


if __name__ == "__main__":
    main()
