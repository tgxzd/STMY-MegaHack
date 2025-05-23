/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/agrox_contract.json`.
 */
export type AgroxContract = {
    "address": "4oweKJAgekQk5WoixX6Uagk8SNTbpPZb6QhmYd9Vv6nW",
    "metadata": {
      "name": "agroxContract",
      "version": "0.1.0",
      "spec": "0.1.0",
      "description": "Created with Anchor"
    },
    "instructions": [
      {
        "name": "claimRewards",
        "discriminator": [
          4,
          144,
          132,
          71,
          116,
          23,
          151,
          80
        ],
        "accounts": [
          {
            "name": "machine",
            "writable": true
          },
          {
            "name": "user",
            "signer": true
          }
        ],
        "args": []
      },
      {
        "name": "createPlant",
        "discriminator": [
          54,
          36,
          254,
          203,
          1,
          141,
          112,
          190
        ],
        "accounts": [
          {
            "name": "cluster",
            "writable": true
          },
          {
            "name": "plant",
            "writable": true,
            "pda": {
              "seeds": [
                {
                  "kind": "const",
                  "value": [
                    112,
                    108,
                    97,
                    110,
                    116
                  ]
                },
                {
                  "kind": "arg",
                  "path": "plantName"
                }
              ]
            }
          },
          {
            "name": "machine",
            "writable": true
          },
          {
            "name": "user",
            "writable": true,
            "signer": true
          },
          {
            "name": "systemProgram",
            "address": "11111111111111111111111111111111"
          }
        ],
        "args": [
          {
            "name": "plantName",
            "type": "string"
          }
        ]
      },
      {
        "name": "delegate",
        "docs": [
          "Delegate the account to the delegation program"
        ],
        "discriminator": [
          90,
          147,
          75,
          178,
          85,
          88,
          4,
          137
        ],
        "accounts": [
          {
            "name": "payer",
            "signer": true
          },
          {
            "name": "bufferPda",
            "writable": true,
            "pda": {
              "seeds": [
                {
                  "kind": "const",
                  "value": [
                    98,
                    117,
                    102,
                    102,
                    101,
                    114
                  ]
                },
                {
                  "kind": "account",
                  "path": "pda"
                }
              ],
              "program": {
                "kind": "const",
                "value": [
                  56,
                  153,
                  144,
                  62,
                  95,
                  5,
                  162,
                  244,
                  127,
                  68,
                  213,
                  47,
                  238,
                  243,
                  85,
                  253,
                  209,
                  56,
                  22,
                  10,
                  190,
                  179,
                  206,
                  102,
                  246,
                  43,
                  128,
                  125,
                  209,
                  240,
                  23,
                  139
                ]
              }
            }
          },
          {
            "name": "delegationRecordPda",
            "writable": true,
            "pda": {
              "seeds": [
                {
                  "kind": "const",
                  "value": [
                    100,
                    101,
                    108,
                    101,
                    103,
                    97,
                    116,
                    105,
                    111,
                    110
                  ]
                },
                {
                  "kind": "account",
                  "path": "pda"
                }
              ],
              "program": {
                "kind": "account",
                "path": "delegationProgram"
              }
            }
          },
          {
            "name": "delegationMetadataPda",
            "writable": true,
            "pda": {
              "seeds": [
                {
                  "kind": "const",
                  "value": [
                    100,
                    101,
                    108,
                    101,
                    103,
                    97,
                    116,
                    105,
                    111,
                    110,
                    45,
                    109,
                    101,
                    116,
                    97,
                    100,
                    97,
                    116,
                    97
                  ]
                },
                {
                  "kind": "account",
                  "path": "pda"
                }
              ],
              "program": {
                "kind": "account",
                "path": "delegationProgram"
              }
            }
          },
          {
            "name": "pda",
            "docs": [
              "CHECK The pda to delegate"
            ],
            "writable": true
          },
          {
            "name": "ownerProgram",
            "address": "4oweKJAgekQk5WoixX6Uagk8SNTbpPZb6QhmYd9Vv6nW"
          },
          {
            "name": "delegationProgram",
            "address": "DELeGGvXpWV2fqJUhqcF5ZSYMS4JTLjteaAMARRSaeSh"
          },
          {
            "name": "systemProgram",
            "address": "11111111111111111111111111111111"
          }
        ],
        "args": []
      },
      {
        "name": "initialize",
        "discriminator": [
          175,
          175,
          109,
          31,
          13,
          152,
          155,
          237
        ],
        "accounts": [
          {
            "name": "cluster",
            "writable": true,
            "pda": {
              "seeds": [
                {
                  "kind": "const",
                  "value": [
                    99,
                    108,
                    117,
                    115,
                    116,
                    101,
                    114
                  ]
                }
              ]
            }
          },
          {
            "name": "authority",
            "writable": true,
            "signer": true
          },
          {
            "name": "systemProgram",
            "address": "11111111111111111111111111111111"
          }
        ],
        "args": []
      },
      {
        "name": "processUndelegation",
        "discriminator": [
          196,
          28,
          41,
          206,
          48,
          37,
          51,
          167
        ],
        "accounts": [
          {
            "name": "baseAccount",
            "writable": true
          },
          {
            "name": "buffer"
          },
          {
            "name": "payer",
            "writable": true
          },
          {
            "name": "systemProgram"
          }
        ],
        "args": [
          {
            "name": "accountSeeds",
            "type": {
              "vec": "bytes"
            }
          }
        ]
      },
      {
        "name": "registerMachine",
        "discriminator": [
          168,
          160,
          68,
          209,
          28,
          151,
          41,
          17
        ],
        "accounts": [
          {
            "name": "cluster",
            "writable": true
          },
          {
            "name": "machine",
            "writable": true,
            "pda": {
              "seeds": [
                {
                  "kind": "const",
                  "value": [
                    109,
                    97,
                    99,
                    104,
                    105,
                    110,
                    101
                  ]
                },
                {
                  "kind": "arg",
                  "path": "machineId"
                }
              ]
            }
          },
          {
            "name": "user",
            "writable": true,
            "signer": true
          },
          {
            "name": "systemProgram",
            "address": "11111111111111111111111111111111"
          }
        ],
        "args": [
          {
            "name": "machineId",
            "type": "string"
          }
        ]
      },
      {
        "name": "startMachine",
        "discriminator": [
          121,
          244,
          42,
          69,
          36,
          146,
          206,
          127
        ],
        "accounts": [
          {
            "name": "machine",
            "writable": true
          },
          {
            "name": "user",
            "signer": true
          }
        ],
        "args": []
      },
      {
        "name": "stopMachine",
        "discriminator": [
          191,
          189,
          244,
          250,
          83,
          220,
          186,
          32
        ],
        "accounts": [
          {
            "name": "machine",
            "writable": true
          },
          {
            "name": "user",
            "signer": true
          }
        ],
        "args": []
      },
      {
        "name": "undelegate",
        "docs": [
          "Undelegate the account from the delegation program"
        ],
        "discriminator": [
          131,
          148,
          180,
          198,
          91,
          104,
          42,
          238
        ],
        "accounts": [
          {
            "name": "payer",
            "writable": true,
            "signer": true
          },
          {
            "name": "pda",
            "writable": true
          },
          {
            "name": "magicProgram",
            "address": "Magic11111111111111111111111111111111111111"
          },
          {
            "name": "magicContext",
            "writable": true,
            "address": "MagicContext1111111111111111111111111111111"
          }
        ],
        "args": []
      },
      {
        "name": "uploadData",
        "discriminator": [
          71,
          186,
          8,
          42,
          188,
          75,
          135,
          230
        ],
        "accounts": [
          {
            "name": "cluster",
            "writable": true
          },
          {
            "name": "machine",
            "writable": true
          },
          {
            "name": "plant",
            "writable": true
          },
          {
            "name": "data",
            "writable": true,
            "pda": {
              "seeds": [
                {
                  "kind": "const",
                  "value": [
                    100,
                    97,
                    116,
                    97
                  ]
                },
                {
                  "kind": "account",
                  "path": "machine.machine_id",
                  "account": "machine"
                },
                {
                  "kind": "account",
                  "path": "plant.plant_name",
                  "account": "plantData"
                }
              ]
            }
          },
          {
            "name": "payer",
            "writable": true,
            "signer": true
          },
          {
            "name": "systemProgram",
            "address": "11111111111111111111111111111111"
          }
        ],
        "args": [
          {
            "name": "temperature",
            "type": "f64"
          },
          {
            "name": "humidity",
            "type": "f64"
          },
          {
            "name": "imageUrl",
            "type": {
              "option": "string"
            }
          }
        ]
      },
      {
        "name": "useData",
        "discriminator": [
          245,
          181,
          226,
          28,
          125,
          41,
          221,
          84
        ],
        "accounts": [
          {
            "name": "cluster",
            "writable": true
          },
          {
            "name": "machine",
            "writable": true
          },
          {
            "name": "data",
            "writable": true
          },
          {
            "name": "user",
            "signer": true
          }
        ],
        "args": [
          {
            "name": "entryIndex",
            "type": "u64"
          }
        ]
      }
    ],
    "accounts": [
      {
        "name": "ioTData",
        "discriminator": [
          254,
          141,
          112,
          46,
          177,
          47,
          45,
          83
        ]
      },
      {
        "name": "plantData",
        "discriminator": [
          168,
          139,
          111,
          70,
          1,
          222,
          84,
          115
        ]
      }
    ],
    "errors": [
      {
        "code": 6000,
        "name": "machineIdAlreadyExists",
        "msg": "Machine ID already exists"
      },
      {
        "code": 6001,
        "name": "unauthorized",
        "msg": "Unauthorized operation"
      },
      {
        "code": 6002,
        "name": "machineNotActive",
        "msg": "Machine is not active"
      },
      {
        "code": 6003,
        "name": "noRewardsAvailable",
        "msg": "No rewards available to claim"
      },
      {
        "code": 6004,
        "name": "unregisteredPlant",
        "msg": "Unregistered plant"
      },
      {
        "code": 6005,
        "name": "invalidDataEntryIndex",
        "msg": "Invalid data entry index"
      },
      {
        "code": 6006,
        "name": "plantNotLinkedToMachine",
        "msg": "Plant not linked to the specified machine"
      }
    ],
    "types": [
      {
        "name": "dataEntry",
        "type": {
          "kind": "struct",
          "fields": [
            {
              "name": "timestamp",
              "type": "i64"
            },
            {
              "name": "temperature",
              "type": "f64"
            },
            {
              "name": "humidity",
              "type": "f64"
            },
            {
              "name": "imageUrl",
              "type": {
                "option": "string"
              }
            },
            {
              "name": "usedCount",
              "type": "u64"
            }
          ]
        }
      },
      {
        "name": "ioTData",
        "type": {
          "kind": "struct",
          "fields": [
            {
              "name": "machine",
              "type": "pubkey"
            },
            {
              "name": "plant",
              "type": "pubkey"
            },
            {
              "name": "dataEntries",
              "type": {
                "vec": {
                  "defined": {
                    "name": "dataEntry"
                  }
                }
              }
            },
            {
              "name": "bump",
              "type": "u8"
            }
          ]
        }
      },
      {
        "name": "plantData",
        "type": {
          "kind": "struct",
          "fields": [
            {
              "name": "creator",
              "type": "pubkey"
            },
            {
              "name": "plantName",
              "type": "string"
            },
            {
              "name": "dataCount",
              "type": "u64"
            },
            {
              "name": "imageCount",
              "type": "u64"
            },
            {
              "name": "creationTimestamp",
              "type": "i64"
            },
            {
              "name": "lastUpdateTimestamp",
              "type": "i64"
            },
            {
              "name": "machine",
              "type": "pubkey"
            },
            {
              "name": "bump",
              "type": "u8"
            }
          ]
        }
      }
    ]
  };
  