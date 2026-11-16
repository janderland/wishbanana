import {Queue} from "./queue.ts";
import {assertEquals} from "@std/assert";

Deno.test("enqueue", () => {
    let item1: string | undefined;
    let item2: string | undefined;

    const m = new Queue<string>(false, (i1, i2) => {
        item1 = i1;
        item2 = i2;
    });

    assertEquals(item1, undefined);
    assertEquals(item2, undefined);

    m.enqueue("1", "p1");

    assertEquals(item1, undefined);
    assertEquals(item2, undefined);

    m.enqueue("2", "p2");

    assertEquals(item1, "p1");
    assertEquals(item2, "p2");

    m.enqueue("3", "p3");

    assertEquals(item1, "p1");
    assertEquals(item2, "p2");
});

Deno.test("single", () => {
    let player1: string | undefined;
    let player2: string | undefined;

    const m = new Queue<string>(true, (p1, p2) => {
        player1 = p1;
        player2 = p2;
    });

    assertEquals(player1, undefined);
    assertEquals(player2, undefined);

    m.enqueue("1", "p1");

    assertEquals(player1, "p1");
    assertEquals(player2, undefined);

    m.enqueue("2", "p2");

    assertEquals(player1, "p2");
    assertEquals(player2, undefined);
});

Deno.test("drop", () => {
    let player1: string | undefined;
    let player2: string | undefined;

    const m = new Queue<string>(false, (p1, p2) => {
        player1 = p1;
        player2 = p2;
    });

    assertEquals(player1, undefined);
    assertEquals(player2, undefined);

    m.enqueue("1", "p1")

    assertEquals(player1, undefined);
    assertEquals(player2, undefined);

    m.drop("1")

    assertEquals(player1, undefined);
    assertEquals(player2, undefined);

    m.enqueue("2", "p2")

    assertEquals(player1, undefined);
    assertEquals(player2, undefined);
})
