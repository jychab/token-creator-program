/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/token_transfer_hook.json`.
 */
export type TokenTransferHook = {
  address: "FNeSgS1XbVmbxZgNBHfpXxh6aivuTSf3hSCncT6QDm9T";
  metadata: {
    name: "tokenTransferHook";
    version: "0.1.0";
    spec: "0.1.0";
    description: "Created with Anchor";
  };
  instructions: [
    {
      name: "initializeExtraAccountMetaList";
      discriminator: [92, 197, 174, 197, 41, 124, 19, 3];
      accounts: [
        {
          name: "payer";
          writable: true;
          signer: true;
        },
        {
          name: "extraAccountMetaList";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  101,
                  120,
                  116,
                  114,
                  97,
                  45,
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116,
                  45,
                  109,
                  101,
                  116,
                  97,
                  115
                ];
              },
              {
                kind: "account";
                path: "mint";
              }
            ];
          };
        },
        {
          name: "pdaAuthority";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  112,
                  100,
                  97,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ];
              },
              {
                kind: "account";
                path: "mint";
              }
            ];
          };
        },
        {
          name: "minterFeeAccount";
          writable: true;
        },
        {
          name: "authorityFeeAccount";
          writable: true;
        },
        {
          name: "programFeeAccount";
          writable: true;
        },
        {
          name: "mint";
        },
        {
          name: "tokenProgram";
        },
        {
          name: "associatedTokenProgram";
          address: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        }
      ];
      args: [
        {
          name: "lamports";
          type: "u64";
        }
      ];
    },
    {
      name: "transferHook";
      discriminator: [220, 57, 220, 152, 126, 125, 97, 168];
      accounts: [
        {
          name: "sourceToken";
        },
        {
          name: "mint";
        },
        {
          name: "destinationToken";
        },
        {
          name: "owner";
        },
        {
          name: "extraAccountMetaList";
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  101,
                  120,
                  116,
                  114,
                  97,
                  45,
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116,
                  45,
                  109,
                  101,
                  116,
                  97,
                  115
                ];
              },
              {
                kind: "account";
                path: "mint";
              }
            ];
          };
        },
        {
          name: "program";
        },
        {
          name: "pdaAuthority";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  112,
                  100,
                  97,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ];
              },
              {
                kind: "account";
                path: "mint";
              }
            ];
          };
        },
        {
          name: "sourceFeeAccount";
        },
        {
          name: "destinationFeeAccount";
        },
        {
          name: "bossFeeAccount";
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
        {
          name: "eventAuthority";
        }
      ];
      args: [
        {
          name: "amount";
          type: "u64";
        }
      ];
    },
    {
      name: "updateFeeAccount";
      discriminator: [217, 138, 47, 96, 184, 90, 227, 19];
      accounts: [
        {
          name: "payer";
          writable: true;
          signer: true;
        },
        {
          name: "feeAccount";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [102, 101, 101];
              },
              {
                kind: "account";
                path: "mint";
              },
              {
                kind: "arg";
                path: "address";
              }
            ];
          };
        },
        {
          name: "instructionSysvarAccount";
          address: "Sysvar1nstructions1111111111111111111111111";
        },
        {
          name: "mint";
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
        {
          name: "eventAuthority";
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  95,
                  95,
                  101,
                  118,
                  101,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ];
              }
            ];
          };
        },
        {
          name: "program";
        }
      ];
      args: [
        {
          name: "address";
          type: "pubkey";
        },
        {
          name: "boss";
          type: {
            option: "pubkey";
          };
        },
        {
          name: "additionalClaimedFees";
          type: {
            option: "u64";
          };
        },
        {
          name: "additionalUnclaimedFees";
          type: {
            option: "u64";
          };
        }
      ];
    },
    {
      name: "updateFees";
      discriminator: [225, 27, 13, 6, 69, 84, 172, 191];
      accounts: [
        {
          name: "sourceToken";
        },
        {
          name: "mint";
        },
        {
          name: "destinationToken";
        },
        {
          name: "payer";
          writable: true;
          signer: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  112,
                  100,
                  97,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ];
              },
              {
                kind: "account";
                path: "mint";
              }
            ];
          };
        },
        {
          name: "sourceFeeAccount";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [102, 101, 101];
              },
              {
                kind: "account";
                path: "mint";
              },
              {
                kind: "account";
                path: "source_token.owner";
              }
            ];
          };
        },
        {
          name: "destinationFeeAccount";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [102, 101, 101];
              },
              {
                kind: "account";
                path: "mint";
              },
              {
                kind: "account";
                path: "destination_token.owner";
              }
            ];
          };
        },
        {
          name: "bossFeeAccount";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [102, 101, 101];
              },
              {
                kind: "account";
                path: "mint";
              },
              {
                kind: "account";
                path: "sourceFeeAccount";
              }
            ];
          };
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
        {
          name: "eventAuthority";
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  95,
                  95,
                  101,
                  118,
                  101,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ];
              }
            ];
          };
        },
        {
          name: "program";
        }
      ];
      args: [
        {
          name: "fee";
          type: "u64";
        },
        {
          name: "amountAfterFee";
          type: "u64";
        }
      ];
    }
  ];
  accounts: [
    {
      name: "feeAccount";
      discriminator: [137, 191, 201, 34, 168, 222, 43, 138];
    }
  ];
  events: [
    {
      name: "feeUpdateEvent";
      discriminator: [240, 206, 67, 25, 251, 107, 133, 34];
    },
    {
      name: "transferEvent";
      discriminator: [100, 10, 46, 113, 8, 28, 179, 125];
    }
  ];
  errors: [
    {
      code: 6000;
      name: "unauthorized";
      msg: "Unauthorized Invoke";
    }
  ];
  types: [
    {
      name: "feeAccount";
      serialization: "bytemuck";
      repr: {
        kind: "c";
      };
      type: {
        kind: "struct";
        fields: [
          {
            name: "boss";
            type: "pubkey";
          },
          {
            name: "unclaimedFees";
            type: "u64";
          },
          {
            name: "claimedFees";
            type: "u64";
          },
          {
            name: "bump";
            type: "u8";
          },
          {
            name: "extraMetaBump";
            type: "u8";
          },
          {
            name: "pdaAuthorityBump";
            type: "u8";
          },
          {
            name: "padding";
            type: {
              array: ["u8", 5];
            };
          }
        ];
      };
    },
    {
      name: "feeUpdateEvent";
      type: {
        kind: "struct";
        fields: [
          {
            name: "mint";
            type: "pubkey";
          },
          {
            name: "address";
            type: "pubkey";
          },
          {
            name: "boss";
            type: "pubkey";
          },
          {
            name: "unclaimedFees";
            type: "u64";
          },
          {
            name: "claimedFees";
            type: "u64";
          }
        ];
      };
    },
    {
      name: "transferEvent";
      type: {
        kind: "struct";
        fields: [
          {
            name: "mint";
            type: "pubkey";
          },
          {
            name: "source";
            type: "pubkey";
          },
          {
            name: "sourceBoss";
            type: "pubkey";
          },
          {
            name: "destination";
            type: "pubkey";
          },
          {
            name: "destinationBoss";
            type: {
              option: "pubkey";
            };
          },
          {
            name: "destinationTokenAccount";
            type: "pubkey";
          },
          {
            name: "boss";
            type: "pubkey";
          },
          {
            name: "bossUnclaimedFee";
            type: "u64";
          }
        ];
      };
    }
  ];
};
