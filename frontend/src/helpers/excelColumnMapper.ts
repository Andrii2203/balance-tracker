import { Row } from "../hooks/useFetchData/useFetchData";

export const mapColumn = (row: Row) => {
    const allKeys = Object.keys(row);
    // console.log('allKeys line 4 mapColumn', allKeys);
    return {
        perfectGoal: allKeys[2],
        ourMoney: allKeys[4],
        actualGoal: allKeys[3],
        actualPecent: allKeys[5],
        month: allKeys[1],
    }
}