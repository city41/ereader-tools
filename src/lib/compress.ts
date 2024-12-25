type tree_node = {
  node: number;
  data: number;
  count: number;
  value: number;
  look_up: Array<tree_node | null | 1>;
  left: tree_node | null;
  right: tree_node | null;
};

let bitsleft_w = 32;
// let bitsleft_r = 0;
let bits_w = 0;
// let bits_r = 0;

let bits_written = 0;

let bitstore: number[] | null = null;

// #define NUM_BITS get_bitsize(lzsize - 1)

const MAX_TABLE_SIZE = 0x10000;
const MAX_LITERALS = 0x10000;

let skip_lz77 = false;
let skip_huffman = false;
let skip_size = false;

let best_move = 0;
let best_size = 0;

let movetree: tree_node | null = null;
let sizetree: tree_node | null = null;

let log: string[] = [];

function log_write(msg: string, ...args: any[]) {
  log.push(JSON.stringify(msg, args));
  // console.log(msg, args);
}

function get_bitsize(data: number): number {
  let i = data;

  let size = 0;
  while (i > 0) {
    size++;
    i >>= 1;
  }
  return size;
}

function write_bits(data: number, count: number, f: number[] | null) {
  bits_written += count;

  if (!f && !bitstore) {
    return;
  }

  for (let i = 0; i < count; i++) {
    bitsleft_w--;
    bits_w |= ((data >> (count - 1 - i)) & 1) << bitsleft_w;
    if (bitsleft_w === 0) {
      if (f) {
        f.push((bits_w & 0xff000000) >> 24);
        f.push((bits_w & 0x00ff0000) >> 16);
        f.push((bits_w & 0x0000ff00) >> 8);
        f.push((bits_w & 0x000000ff) >> 0);
      }

      if (bitstore) {
        bitstore.push((bits_w & 0xff000000) >> 24);
        bitstore.push((bits_w & 0x00ff0000) >> 16);
        bitstore.push((bits_w & 0x0000ff00) >> 8);
        bitstore.push((bits_w & 0x000000ff) >> 0);
      }

      bitsleft_w = 32;
      bits_w = 0;
    }
  }
}

function flush_bits(f: number[] | null) {
  let i = 32 - bitsleft_w;
  bits_written += i;
  if (f) {
    if (i > 0) f.push((bits_w & 0xff000000) >> 24);
    if (i > 8) f.push((bits_w & 0x00ff0000) >> 16);
    if (i > 16) f.push((bits_w & 0x0000ff00) >> 8);
    if (i > 24) f.push((bits_w & 0x000000ff) >> 0);
  }
  if (bitstore) {
    if (i > 0) bitstore.push((bits_w & 0xff000000) >> 24);
    if (i > 8) bitstore.push((bits_w & 0x00ff0000) >> 16);
    if (i > 16) bitstore.push((bits_w & 0x0000ff00) >> 8);
    if (i > 24) bitstore.push((bits_w & 0x000000ff) >> 0);
  }
  bitsleft_w = 32;
  bits_w = 0;
}

function create_treenode(): tree_node {
  return {
    node: 0,
    value: 0,
    count: 0,
    data: 0,
    left: null,
    right: null,
    look_up: new Array(32).fill(null),
  };
}

function get_treenode(
  tree: tree_node,
  bitcount: number,
  numbits = 0,
  value = 0,
  forcelookup = 0
): tree_node | null {
  let i;
  let tmp: tree_node | null = null;

  if (forcelookup == 1) {
    if (tree.node == 1) {
      tmp = get_treenode(
        tree.left!,
        bitcount,
        numbits + 1,
        value + (0 << numbits),
        1
      );
      if (tmp === null) {
        tmp = get_treenode(
          tree.right!,
          bitcount,
          numbits + 1,
          value + (1 << numbits),
          1
        );
        if (tmp === null) return null;
        else return tmp;
      } else return tmp;
    } else {
      if (tree.data == bitcount) {
        tree.value = 0;
        for (i = 0; i < numbits; i++)
          tree.value |= ((value >> i) & 1) << (numbits - 1 - i);
        tree.value |= numbits << 24;

        return tree;
      } else return null;
    }
  } else {
    return tree.look_up[bitcount] as tree_node | null;
  }
}

function sort_tree(tree: Array<tree_node | null>, count: number) {
  for (let i = 0; i < count; i++)
    for (let j = 0; j < count - 1; j++) {
      let swap1 = tree[j];
      let swap2 = tree[j + 1];
      if (swap1 && swap2 && swap1.count < swap2.count) {
        tree[j] = swap2;
        tree[j + 1] = swap1;
      }
    }
}

function write_huffman_tree(tree: tree_node, f: number[], root = 1) {
  if (tree.node == 1) {
    if (f) log_write("(");

    write_huffman_tree(tree.left!, f, 0);

    if (f) log_write(",");

    write_huffman_tree(tree.right!, f, 0);

    if (f) log_write(")");
    write_bits(1, 1, f);

    if (root == 1) {
      write_bits(1, 1, f);
      if (f) log_write("\n");
    }
  } else {
    write_bits(0, 1, f);
    write_bits(tree.data, 8, f);
    if (root) write_bits(1, 1, f);
    if (f) log_write("%d", tree.data);
    if (root) if (f) log_write("\n");
  }
}

function create_huffman_tree(
  buf: number[],
  count: number,
  f: number[],
  method = 0,
  type = 0
): tree_node {
  let treenodes = 0;
  let ptr: tree_node | null = null;
  let temp1: tree_node | null = null;
  let treeroot: tree_node | null = null;
  let pointer: Array<tree_node | null> = [];

  let max_bitcount = 0;

  const bitcounts: number[] = [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0,
  ];

  for (let i = 0; i < count; i++) {
    let j;
    if (method == 1) {
      j = buf[i];
      if (j % 4 == 0) {
        j += 8;
        j /= 4;
      } else {
        j %= 4;
        j--;
        j = get_bitsize(j);
        if (max_bitcount < j) max_bitcount = j;
        bitcounts[j]++;
        //bitcounts[3]++;

        j = buf[i];
        j += 8;
        j /= 4;
      }
      j = get_bitsize(j);
    } else j = get_bitsize(buf[i]);

    if (max_bitcount < j) max_bitcount = j;

    //if(j<3)
    //	bitcounts[3]++;
    //else
    bitcounts[j]++;
  }

  if (skip_huffman) {
    max_bitcount = 15;
  }
  if (skip_size && type == 1) {
    max_bitcount = 15;
  }

  treeroot = create_treenode();
  treeroot.count = 0;
  treeroot.data = 0;
  treeroot.node = 0;
  treeroot.left = null;
  treeroot.right = null;

  let k, j;

  if (!skip_huffman) {
    if (type == 0) k = best_move;
    else {
      if (!skip_size) k = best_size;
      else k = 0;
    }
  } else k = 0;
  for (let i = 0; i < 32; i++) {
    if (bitcounts[i] > 0) {
      if (i < max_bitcount) {
        j = 0;

        if (
          ((best_move == 0 && type == 0) ||
            (best_size == 0 && type == 1 && !skip_size)) &&
          !skip_huffman
        ) {
          if (bitcounts[i + 1] * 2 >= bitcounts[i]) j = 1;

          if (i < max_bitcount - 3) {
            if (bitcounts[i] < 25) j = 1;
          } else {
            if (bitcounts[i] < 100) j = 1;
          }
        } else {
          if (k & 1) j = 0;
          else j = 1;
        }
        k >>= 1;

        //j=0;
        if (j == 1) {
          bitcounts[i + 1] += bitcounts[i];
          treeroot.look_up[i] = null;
          continue;
        }
      }
      if (f) log_write("%.5d:%.3d\n", bitcounts[i], i);

      ptr = create_treenode();
      ptr.count = bitcounts[i];
      ptr.data = i;
      ptr.left = null;
      ptr.right = null;
      ptr.node = 0;
      pointer[treenodes++] = ptr;
      treeroot.look_up[i] = ptr;
      for (j = i - 1; j >= 0; j--) {
        if (treeroot.look_up[j] === null) {
          treeroot.look_up[j] = ptr;
          continue;
        }
        break;
      }
    } else
      // treeroot.look_up[i] = (tree_node*)(null + 1);
      treeroot.look_up[i] = null;
  }
  if (f) log_write("\n");
  sort_tree(pointer, treenodes);

  while (treenodes > 1) {
    if (treenodes == 2) ptr = treeroot;
    else ptr = create_treenode();
    ptr.node = 1;
    ptr.data = 0;
    treenodes--;
    ptr.right = pointer[treenodes];
    for (let i = treenodes; i >= 0; i--) {
      temp1 = pointer[i];
      if (temp1!.count < ptr.right!.count) ptr.right = temp1;
    }
    for (let i = treenodes; i >= 0; i--) {
      if (ptr.right == pointer[i]) continue;
      ptr.left = pointer[i];
      break;
    }
    for (let i = treenodes; i >= 0; i--) {
      temp1 = pointer[i];
      if (temp1!.count < ptr.left!.count && temp1 != ptr.right)
        ptr.left = temp1;
    }
    ptr.count = ptr.right!.count + ptr.left!.count;

    for (let i = 0; i < treenodes; i++) {
      if (ptr.left == pointer[i] || pointer[i] == null) {
        pointer[i] = pointer[i + 1];
        pointer[i + 1] = null;
      }
    }
    for (let i = 0; i < treenodes; i++) {
      if (ptr.right == pointer[i] || pointer[i] == null) {
        pointer[i] = pointer[i + 1];
        pointer[i + 1] = null;
      }
    }

    pointer[treenodes - 1] = ptr;
  }

  for (let i = 0; i < 32; i++) {
    if (treeroot.look_up[i] === 1) treeroot.look_up[i] = null;
    else get_treenode(treeroot, i, 0, 0, 1);
  }

  write_huffman_tree(pointer[0]!, f);

  return pointer[0] as tree_node;
}

function compress(
  buf: number[],
  size: number,
  compression_level: 0 | 1 | 2 | 3,
  lzwindow: number,
  lzsize: number,
  method: number,
  f: number[],
  bitdata: number[] | null = null
): number {
  const literals: number[] = new Array(MAX_LITERALS);
  const move_t: number[] = new Array(MAX_TABLE_SIZE);
  const size_t: number[] = new Array(MAX_TABLE_SIZE);

  let literals_offset = 0,
    move_offset = 0,
    size_offset = 0;
  let buf_offset, buf_back_offset;
  let i, j, k, l, m, n;

  let lookahead;

  let tmp: tree_node | null;

  let window_bitsize = get_bitsize(lzwindow - 1);

  if (!f && !bitdata && compression_level < 3) {
    return -1;
  }

  if (lzwindow < 16 || lzwindow > 32768) return -3;
  if (lzsize < 16 || lzsize > 32768) return -4;

  if (size > 0x40000)
    //GBA Ram is 256KB. Can't exceed this.
    return -5;

  if (!skip_lz77) {
    if (compression_level !== 0) {
      if (f) log_write("LZ compressing data\n");

      for (buf_offset = 0; buf_offset < size; buf_offset++) {
        if (
          literals_offset == MAX_LITERALS ||
          move_offset > MAX_TABLE_SIZE ||
          size_offset > MAX_TABLE_SIZE
        ) {
          return -2; //Compressor failure, buffer overrun error
        }

        l = m = n = 0;

        //for(buf_back_offset=0;(buf_back_offset<lzwindow) && (buf_back_offset<buf_offset);buf_back_offset++)
        for (
          buf_back_offset =
            buf_offset < lzwindow ? buf_offset - 1 : lzwindow - 1;
          buf_back_offset >= 0;
          buf_back_offset--
        ) {
          i = buf_offset;
          j = buf_back_offset;
          k = 0;
          while (buf[i - (j + 1)] == buf[i] && i < size && k < lzsize - 1) {
            i++;
            k++;
          }
          if (k >= 2) {
            if (k >= l) {
              l = k;
              m = j;
              n = 1;
              //if(k==(lzsize-1))
              //	break;
            }
          }
        }

        // Look ahead one more byte, for a run, just in case there is a better run to use.
        while (n == 1 && l < lzsize - 1) {
          n = 0;
          if (l >= 2) {
            lookahead = l;
            buf_offset++;
            for (
              buf_back_offset = 0;
              buf_back_offset < lzwindow && buf_back_offset < buf_offset;
              buf_back_offset++
            ) {
              i = buf_offset;
              j = buf_back_offset;
              k = 0;
              while (buf[i - (j + 1)] == buf[i] && i < size && k < lzsize - 1) {
                i++;
                k++;
              }
              if (k >= 2) {
                if (k > l) {
                  l = k;
                  m = j;
                }
              }
            }
            buf_offset--;
            if (l > lookahead) {
              n = 1;
              literals[literals_offset++] = buf[buf_offset++];
            } else l = lookahead;
          }
        }
        if (l >= 2) {
          literals[literals_offset++] = 0x100;
          move_t[move_offset++] = m + 1;
          size_t[size_offset++] = l;
          buf_offset += l - 1;
        } else literals[literals_offset++] = buf[buf_offset];
      }
      literals[literals_offset++] = 0x1ff;
    } else {
      for (buf_offset = 0; buf_offset < size; buf_offset++)
        literals[literals_offset++] = buf[buf_offset];
      literals[literals_offset++] = 0x1ff;
    }
  } else {
    while (literals[literals_offset] != 0x1ff) {
      if (literals[literals_offset++] == 0x100) {
        move_offset++;
        size_offset++;
      }
    }
  }

  flush_bits(null);
  bitstore = bitdata;
  bits_written = 0;
  write_bits(0x76706b30, 32, f);
  /*fputc('v',f);
	fputc('p',f);
	fputc('k',f);
	fputc('0',f);*/
  write_bits(size, 32, f);
  write_bits(method & 0xff, 8, f);
  //fputc(method&0xFF,f);

  literals_offset = 0;

  if (compression_level === 0) {
    if (f) log_write("Writing vpk data\n");

    write_bits(0x03, 2, f);
    for (i = 0; i < size; i++) write_bits(literals[i], 9, f);
    flush_bits(f);
  } else if (compression_level === 1) {
    if (f) log_write("Writing vpk data\n");

    move_offset = 0;
    size_offset = 0;

    //Move tree is 12 (4095 byte window)
    write_bits(0, 1, f);
    write_bits(window_bitsize, 8, f);
    write_bits(1, 1, f);

    //Size tree is 8 (255 bytes)
    write_bits(0, 1, f);
    write_bits(get_bitsize(lzsize - 1), 8, f);
    write_bits(1, 1, f);

    while (literals[literals_offset] != 0x1ff) {
      if (literals[literals_offset] == 0x100) {
        write_bits(1, 1, f);
        if (method == 1) {
          j = move_t[move_offset];
          if (j % 4 == 0) {
            j += 8;
            j /= 4;
            write_bits(j, window_bitsize, f);
          } else {
            j %= 4;
            j--;
            write_bits(j, window_bitsize, f);

            j = move_t[move_offset];
            j += 8;
            j /= 4;
            write_bits(j, window_bitsize, f);
          }
          move_offset++;
        } else {
          write_bits(move_t[move_offset++], window_bitsize, f);
        }
        write_bits(size_t[size_offset++], get_bitsize(lzsize - 1), f);
      } else {
        write_bits(0, 1, f);
        write_bits(literals[literals_offset], 8, f);
      }
      literals_offset++;
    }
    flush_bits(f);
  } else if (compression_level >= 2) {
    if (f) log_write("Writing huffman trees\n");
    if (f) log_write("----- Move Tree Structure/Frequency Counts-----\n");
    movetree = create_huffman_tree(move_t, move_offset, f, method, 0);
    if (f) log_write("----- Size Tree Structure/Frequency Counts-----\n");
    sizetree = create_huffman_tree(size_t, size_offset, f, 0, 1);
    if (f) log_write("Writing vpk data\n");

    move_offset = 0;
    size_offset = 0;

    while (literals[literals_offset] != 0x1ff) {
      if (literals[literals_offset] == 0x100) {
        write_bits(1, 1, f);

        if (method == 1) {
          j = move_t[move_offset];
          if (j % 4 == 0) {
            j += 8;
            j /= 4;

            /*	if(get_bitsize(j)<3)
						{
							tmp = get_treenode(movetree,3);
							write_bits(tmp[0].value & 0x00FFFFFF,(tmp[0].value>>24),f);
							write_bits(j,tmp[0].data,f);
						}
						else
						{*/
            tmp = get_treenode(movetree, get_bitsize(j));
            if (tmp != null) {
              write_bits(tmp.value & 0x00ffffff, tmp.value >> 24, f);
              write_bits(j, tmp.data, f);
            } else {
              write_bits(j, movetree.data, f);
            }

            //	}
          } else {
            j %= 4;
            j--;
            /*	if(get_bitsize(j)<3)
						{
							tmp = get_treenode(movetree,3);
							write_bits(tmp[0].value & 0x00FFFFFF,(tmp[0].value>>24),f);
							write_bits(j,tmp[0].data,f);
						}
						else
						{*/
            tmp = get_treenode(movetree, get_bitsize(j));
            if (tmp !== null) {
              write_bits(tmp.value & 0x00ffffff, tmp.value >> 24, f);
              write_bits(j, tmp.data, f);
            } else write_bits(j, movetree.data, f);

            //	}

            j = move_t[move_offset];
            j += 8;
            j /= 4;

            /*	if(get_bitsize(j)<3)
						{
							tmp = get_treenode(movetree,3);
							write_bits(tmp[0].value & 0x00FFFFFF,(tmp[0].value>>24),f);
							write_bits(j,tmp[0].data,f);
						}
						else
						{*/
            tmp = get_treenode(movetree, get_bitsize(j));
            if (tmp == null) {
              return -3; //movetree failure
            }
            write_bits(tmp.value & 0x00ffffff, tmp.value >> 24, f);
            write_bits(j, tmp.data, f);
            //	}
          }
          move_offset++;
        } else {
          j = get_bitsize(move_t[move_offset]);
          //if(j<3)
          //	j = 3;
          tmp = get_treenode(movetree, j);
          if (tmp != null) {
            write_bits(tmp.value & 0x00ffffff, tmp.value >> 24, f);
            write_bits(move_t[move_offset++], tmp.data, f);
          } else write_bits(move_t[move_offset++], movetree.data, f);
        }

        j = get_bitsize(size_t[size_offset]);
        //if(j<3)
        //	j = 3;
        tmp = get_treenode(sizetree, j);
        if (tmp != null) {
          write_bits(tmp.value & 0x00ffffff, tmp.value >> 24, f);
          write_bits(size_t[size_offset++], tmp.data, f);
        } else write_bits(size_t[size_offset++], sizetree.data, f);
      } else {
        write_bits(0, 1, f);
        write_bits(literals[literals_offset], 8, f);
      }
      literals_offset++;
    }

    flush_bits(f);

    // free_huffman_tree(movetree);
    // free_huffman_tree(sizetree);
  }

  bitstore = null;

  if (bitdata) return bits_written / 8 + 1;
  else return 0;
}

export { compress };
