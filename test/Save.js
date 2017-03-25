"use strict";

import test from 'ava';

import './helpers/babel_init.js';

import Save from '../app/js/Save.js';

test('Save init', async t => {
    const buffer = new ArrayBuffer(1);
    const save = new Save("test", buffer);

    t.is(save.name, "test");
    t.is(save.buffer, buffer);
    t.false(save.is_ds2());
});

test('Save read/write', async t => {
    const buffer = new ArrayBuffer(500);
    const save = new Save("test", buffer);

    save.set_u8(0, 0x44);
    t.is(save.get_u8(0), 0x44);

    const u16 = 0x65 + ( 0x76 << 8);
    save.set_u16(1, u16);
    t.is(save.get_u16(1), u16);
    t.is(save.get_u8(1), 0x65);
    t.is(save.get_u8(2), 0x76);

    const u32 = 0x44 + (0x65 << 8) + (0x76 << 16) + (0x69 << 24);
    save.set_u32(0, u32);
    t.is(save.get_u32(0), u32);

    t.is(save.get_u8(0), 0x44);
    t.is(save.get_u8(1), 0x65);
    t.is(save.get_u8(2), 0x76);
    t.is(save.get_u8(3), 0x69);

    t.true(save.is_ds2())
});

test('Save bad read/write', async t => {
    const buffer = new ArrayBuffer(500);
    const save = new Save("test", buffer);

    t.throws(() => save.get_int(0, 3));
    t.throws(() => save.set_int(0, 3, 1));

    t.throws(() => save.get_int(0, 0));
    t.throws(() => save.set_int(0, 0, 1));
})
