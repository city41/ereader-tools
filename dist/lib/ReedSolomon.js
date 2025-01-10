"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReedSolomon = void 0;
class _ReedSolomon {
    constructor() {
        this.mm = 8;
        this.nn = 255;
        this.tt = 16;
        this.kk = 239;
        this.pp = 0x187;
        this.b0 = 0x78;
        this.alpha_to = [];
        this.index_of = [];
        this.gg = [];
        this.recd = [];
        this.rs_init = -1;
        this.curr_errlen = 0;
    }
    zerofill(data, len) {
        for (let i = 0; i < len; ++i) {
            data[i] = 0;
        }
    }
    /* Performs ERRORS+ERASURES decoding of RS codes. If decoding is successful, writes
  the codeword into recd[] itself. Otherwise recd[] is unaltered except in the
  erased positions where it is set to zero.
    First "no_eras" erasures are declared by the calling program. Then, the
  maximum # of errors correctable is t_after_eras = floor((2*tt-no_eras)/2). If the number
  of channel errors is not greater than "t_after_eras" the transmitted codeword
   will be recovered. Details of algorithm can be found
  in R. Blahut's "Theory ... of Error-Correcting Codes". */
    eras_dec_rs(eras_pos, no_eras) {
        //   register int i,j,r,q,tmp,tmp1,num1,num2,den,pres_root,pres_loc;
        const phi = new Array(2 * _ReedSolomon.d_tt + 1);
        const tmp_pol = new Array(2 * _ReedSolomon.d_tt + 1);
        //   int U,discr_r,deg_phi,deg_lambda,L,deg_omega;
        const lambda = new Array(2 * _ReedSolomon.d_tt + 1);
        const s = new Array(2 * _ReedSolomon.d_tt + 1);
        const lambda_pr = new Array(2 * _ReedSolomon.d_tt + 1);
        const b = new Array(2 * _ReedSolomon.d_tt + 1);
        const T = new Array(2 * _ReedSolomon.d_tt + 1);
        const omega = new Array(2 * _ReedSolomon.d_tt + 1);
        let syn_error = 0;
        const root = new Array(2 * _ReedSolomon.d_tt + 1);
        const err = new Array(_ReedSolomon.d_nn);
        const reg = new Array(2 * _ReedSolomon.d_tt + 1);
        const loc = new Array(2 * _ReedSolomon.d_tt + 1);
        let count = 0;
        /* Compute erasure locator polynomial phi[x] */
        this.zerofill(tmp_pol, this.nn - this.kk + 1);
        this.zerofill(phi, this.nn - this.kk + 1);
        if (no_eras > 0) {
            phi[0] = 1; /* index form */
            phi[1] = this.alpha_to[eras_pos[0]];
            for (let i = 1; i < no_eras; i++) {
                const U = eras_pos[i];
                for (let j = 1; j < i + 2; j++) {
                    const tmp1 = this.index_of[phi[j - 1]];
                    tmp_pol[j] = tmp1 == 0xff ? 0 : this.alpha_to[(U + tmp1) % 0xff];
                }
                for (let j = 1; j < i + 2; j++)
                    phi[j] = phi[j] ^ tmp_pol[j];
            }
            /* put phi[x] in index form */
            this.make_rev(phi, this.nn - this.kk + 1);
        }
        /* recd[] is in polynomial form, convert to index form */
        this.make_rev(this.recd, this.nn);
        /* first form the syndromes; i.e., evaluate recd(x) at roots of g(x) namely
     @**(b0+i), i = 0, ... ,(2*tt-1) */
        for (let i = 1; i <= this.nn - this.kk; i++) {
            s[i] = 0;
            for (let j = 0; j < this.nn; j++)
                if (this.recd[j] != 0xff)
                    s[i] ^=
                        this.alpha_to[(this.recd[j] + (this.b0 + i - 1) * j) % 0xff]; /* recd[j] in index form */
            /* convert syndrome from polynomial form to index form  */
            if (s[i] != 0)
                syn_error = 1; /* set flag if non-zero syndrome => error */
            s[i] = this.index_of[s[i]];
        }
        if (syn_error) {
            /* if syndrome is zero, modified recd[] is a codeword */
            /* Begin Berlekamp-Massey algorithm to determine error+erasure locator polynomial */
            let r = no_eras;
            let deg_phi = no_eras;
            let L = no_eras;
            if (no_eras > 0) {
                /* Initialize lambda(x) and b(x) (in poly-form) to phi(x) */
                for (let i = 0; i < deg_phi + 1; i++)
                    lambda[i] = phi[i] == 0xff ? 0 : this.alpha_to[phi[i]];
                for (let i = deg_phi + 1; i < 2 * this.tt + 1; i++)
                    lambda[i] = 0;
                // let deg_lambda = deg_phi;
                for (let i = 0; i < 2 * this.tt + 1; i++)
                    b[i] = lambda[i];
            }
            else {
                lambda[0] = 1;
                for (let i = 1; i < 2 * this.tt + 1; i++)
                    lambda[i] = 0;
                for (let i = 0; i < 2 * this.tt + 1; i++)
                    b[i] = lambda[i];
            }
            while (++r <= 2 * this.tt) {
                /* r is the step number */
                /* Compute discrepancy at the r-th step in poly-form */
                let discr_r = 0;
                for (let i = 0; i < 2 * this.tt + 1; i++) {
                    if (lambda[i] != 0 && s[r - i] != 0xff) {
                        let tmp = this.alpha_to[(this.index_of[lambda[i]] + s[r - i]) % 0xff];
                        discr_r ^= tmp;
                    }
                }
                if (discr_r == 0) {
                    /* 3 lines below: B(x) <-- x*B(x) */
                    tmp_pol[0] = 0;
                    for (let i = 1; i < 2 * this.tt + 1; i++)
                        tmp_pol[i] = b[i - 1];
                    for (let i = 0; i < 2 * this.tt + 1; i++)
                        b[i] = tmp_pol[i];
                }
                else {
                    /* 5 lines below: T(x) <-- lambda(x) - discr_r*x*b(x) */
                    T[0] = lambda[0];
                    for (let i = 1; i < 2 * this.tt + 1; i++) {
                        let tmp = b[i - 1] == 0
                            ? 0
                            : this.alpha_to[(this.index_of[discr_r] + this.index_of[b[i - 1]]) % 0xff];
                        T[i] = lambda[i] ^ tmp;
                    }
                    if (2 * L <= r + no_eras - 1) {
                        L = r + no_eras - L;
                        /* 2 lines below: B(x) <-- inv(discr_r) * lambda(x) */
                        for (let i = 0; i < 2 * this.tt + 1; i++)
                            b[i] =
                                lambda[i] == 0
                                    ? 0
                                    : this.alpha_to[(this.index_of[lambda[i]] -
                                        this.index_of[discr_r] +
                                        this.nn) %
                                        0xff];
                        for (let i = 0; i < 2 * this.tt + 1; i++)
                            lambda[i] = T[i];
                    }
                    else {
                        for (let i = 0; i < 2 * this.tt + 1; i++)
                            lambda[i] = T[i];
                        /* 3 lines below: B(x) <-- x*B(x) */
                        tmp_pol[0] = 0;
                        for (let i = 1; i < 2 * this.tt + 1; i++)
                            tmp_pol[i] = b[i - 1];
                        for (let i = 0; i < 2 * this.tt + 1; i++)
                            b[i] = tmp_pol[i];
                    }
                }
            }
            /* Put lambda(x) into index form */
            this.make_rev(lambda, 2 * this.tt + 1);
            /* Compute deg(lambda(x)) */
            let deg_lambda = 2 * this.tt;
            while (lambda[deg_lambda] == 0xff && deg_lambda > 0)
                --deg_lambda;
            if (deg_lambda <= 2 * this.tt) {
                /* Find roots of the error+erasure locator polynomial. By Chien Search */
                for (let i = 1; i < 2 * this.tt + 1; i++)
                    reg[i] = lambda[i];
                count = 0; /* Number of roots of lambda(x) */
                for (let i = 1; i <= this.nn; i++) {
                    let q = 1;
                    for (let j = 1; j <= deg_lambda; j++)
                        if (reg[j] != 0xff) {
                            reg[j] = (reg[j] + j) % 0xff;
                            q ^= this.alpha_to[reg[j] % 0xff];
                        }
                    if (!q) {
                        /* store root (index-form) and error location number */
                        root[count] = i;
                        loc[count] = this.nn - i;
                        count++;
                    }
                }
                if (deg_lambda == count) {
                    /* correctable error */
                    /* Compute err+eras evaluator poly omega(x) = s(x)*lambda(x) (modulo x**(nn-kk)). in poly-form */
                    for (let i = 0; i < 2 * this.tt; i++) {
                        omega[i] = 0;
                        for (let j = 0; j < deg_lambda + 1 && j < i + 1; j++) {
                            let tmp;
                            if (s[i + 1 - j] != 0xff && lambda[j] != 0xff)
                                tmp = this.alpha_to[(s[i + 1 - j] + lambda[j]) % 0xff];
                            else
                                tmp = 0;
                            omega[i] ^= tmp;
                        }
                    }
                    omega[2 * this.tt] = 0;
                    /* Compute lambda_pr(x) = formal derivative of lambda(x) in poly-form */
                    for (let i = 0; i < this.tt; i++) {
                        lambda_pr[2 * i + 1] = 0;
                        lambda_pr[2 * i] =
                            lambda[2 * i + 1] == 0xff ? 0 : this.alpha_to[lambda[2 * i + 1]];
                    }
                    lambda_pr[2 * this.tt] = 0;
                    /* Compute deg(omega(x)) */
                    let deg_omega = 2 * this.tt;
                    while (omega[deg_omega] == 0 && deg_omega > 0)
                        --deg_omega;
                    /* Compute error values in poly-form. num1 = omega(inv(X(l))),
            num2 = inv(X(l))**(b0-1) and den = lambda_pr(inv(X(l))) all in poly-form */
                    for (let j = 0; j < count; j++) {
                        let pres_root = root[j];
                        let pres_loc = loc[j];
                        let num1 = 0;
                        for (let i = 0; i < deg_omega + 1; i++) {
                            let tmp;
                            if (omega[i] != 0)
                                tmp =
                                    this.alpha_to[(this.index_of[omega[i]] + i * pres_root) % 0xff];
                            else
                                tmp = 0;
                            num1 ^= tmp;
                        }
                        let num2 = this.alpha_to[(pres_root * (this.b0 - 1)) % 0xff];
                        let den = 0;
                        for (let i = 0; i < deg_lambda + 1; i++) {
                            let tmp;
                            if (lambda_pr[i] != 0)
                                tmp =
                                    this.alpha_to[(this.index_of[lambda_pr[i]] + i * pres_root) % 0xff];
                            else
                                tmp = 0;
                            den ^= tmp;
                        }
                        if (den == 0) {
                            throw new Error("Division by zero");
                        }
                        err[pres_loc] = 0;
                        if (num1 != 0) {
                            err[pres_loc] =
                                this.alpha_to[(this.index_of[num1] +
                                    this.index_of[num2] +
                                    (this.nn - this.index_of[den])) %
                                    0xff];
                        }
                    }
                    /* Correct word by subtracting out error bytes. First convert recd[] into poly-form */
                    this.make_pow(this.recd, this.nn);
                    for (let j = 0; j < count; j++)
                        this.recd[loc[j]] ^= err[loc[j]];
                    return count;
                } /* deg(lambda) unequal to number of roots => uncorrectable error detected */
                else
                    return -2;
            } /* deg(lambda) > 2*tt => uncorrectable error detected */
            else
                return -3;
        }
        else {
            /* no non-zero syndromes => no errors: output received codeword */
            this.make_pow(this.recd, this.nn);
            return 0;
        }
    }
    make_pow(data, len) {
        for (let i = 0; i < len; i++)
            data[i] = this.alpha_to[data[i]];
    }
    make_rev(data, len) {
        for (let i = 0; i < len; i++)
            data[i] = this.index_of[data[i]];
    }
    gen_poly(errlen = 16) {
        /* Obtain the generator polynomial of the tt-error correcting, length
      nn=(2**mm -1) Reed Solomon code  from the product of (X+alpha**i), i=1..2*tt
    */
        let y;
        let x;
        this.gg = new Array(errlen);
        this.gg[0] = this.alpha_to[this.b0];
        for (let i = 1; i < errlen; i++) {
            this.gg[i] = 1;
            for (let j = i; j >= 0; j--) {
                if (j == 0)
                    y = 0;
                else
                    y = this.gg[j - 1];
                x = this.gg[j];
                if (x != 0) {
                    x = this.index_of[x] + this.b0 + i;
                    if (x >= 0xff)
                        x -= 0xff;
                    y ^= this.alpha_to[x];
                }
                this.gg[j] = y;
            }
        }
        this.make_rev(this.gg, errlen);
    }
    generate_gf() {
        this.alpha_to = new Array(this.nn + 1);
        this.index_of = new Array(this.nn + 1);
        let mask = 1;
        this.alpha_to[this.nn] = 0;
        this.index_of[0] = this.nn;
        for (let i = 0; i < this.nn; i++) {
            this.alpha_to[i] = mask;
            this.index_of[mask] = i;
            mask <<= 1;
            if (mask >= this.nn + 1)
                mask ^= this.pp;
        }
    }
    initialize_rs(bits = 8, polynomial = 0x187, index = 0x78, errlen = 16) {
        this.mm = bits;
        if (this.rs_init != this.mm) {
            let j = 1;
            for (let i = 0; i < this.mm; i++, j <<= 1)
                ;
            this.nn = j - 1;
            this.pp = polynomial;
            this.b0 = index;
            this.tt = errlen / 2;
            this.kk = this.nn - 2 * this.tt;
            this.generate_gf();
            this.gen_poly(errlen);
            this.curr_errlen = errlen;
            this.recd = new Array(this.nn);
            this.rs_init = this.mm;
        }
        if (this.curr_errlen !== errlen) {
            this.tt = errlen / 2;
            this.kk = this.nn - 2 * this.tt;
            this.gen_poly(errlen);
            this.curr_errlen = errlen;
        }
    }
    reverse_byte_order(data, len) {
        for (let i = 0; i < len >> 1; i++) {
            const x = data[i];
            data[i] = data[len - i - 1];
            data[len - i - 1] = x;
        }
    }
    invert_error_bytes(data, len) {
        for (let i = 0; i < len; i++)
            data[i] ^= 0xff;
    }
    correct_errors(data, errlen, erasure = null) {
        let result = 0;
        let j = 0;
        const erase_pos = new Array(2 * _ReedSolomon.d_tt);
        for (let i = 0; i < this.nn; i++)
            this.recd[i] = 0;
        if (erasure) {
            this.reverse_byte_order(erasure, data.length);
            for (let i = 0, j = 0; i < data.length; i++)
                if (erasure[i])
                    erase_pos[j++] = i;
        }
        for (let i = 0; i < data.length; i++) {
            this.recd[i] = data[i];
        }
        this.reverse_byte_order(this.recd, data.length);
        this.invert_error_bytes(this.recd, errlen);
        result = this.eras_dec_rs(erase_pos, j);
        if (result > 0)
            if (this.eras_dec_rs(erase_pos, 0) != 0)
                //0 syndrome should be returned now.
                return -1; //Otherwise errors not correctable.
        for (let i = 0; i < data.length; i++)
            data[i] = this.recd[i];
        this.invert_error_bytes(data, errlen);
        this.reverse_byte_order(data, data.length);
        return result;
    }
    get isInitialized() {
        return this.mm === this.rs_init;
    }
}
_ReedSolomon.d_mm = 8; /* RS code over GF(2**4) - change to suit */
_ReedSolomon.d_nn = 255; /* nn=2**mm -1   length of codeword */
_ReedSolomon.d_tt = 127; /* number of errors that can be corrected */
_ReedSolomon.d_kk = _ReedSolomon.d_nn - 2 * _ReedSolomon.d_tt; /* kk = nn-2*tt  */
const ReedSolomon = new _ReedSolomon();
exports.ReedSolomon = ReedSolomon;
//# sourceMappingURL=ReedSolomon.js.map