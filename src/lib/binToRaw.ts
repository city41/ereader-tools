import * as fsp from 'node:fs/promises'

async function binToRaw(binfile: string, rawfile: string)
{
    const data: number[] = new Array(64);
    const bin: number[] = new Array(0x840);
    const dotcodetemp: number[] = new Array(0xb60);
    const raw: number[] = new Array(0xb60);
    let dotcodepointer = 0;
    let dotcodeinterleave;
	
	let i,j,k,l;
	let temp;
	let size;
    let g: number[];

	initialize_rs();

    const fbuffer = await fsp.readFile(binfile)
    const f: number[] = Array.from(fbuffer);

	const count=count_bin(f);
	for(l=0;l<count;l++)
	{
		size=read_next_bin(f,bin);
		if(bin_type == BIN_TYPE_NEDC_SINGLE)
			dotcodelen = ((size==0x81C) ? 28 : 18);
		if(bin_type == BIN_TYPE_NEDC_MULTI)
			dotcodelen = ((size==0x840) ? 28 : 18);


		for(i=0;i<(dotcodelen);i++)
			for(j=0;j<2;j++)
			{
				temp = ((i*2)+j)%0x18;
				raw[(i*0x68)+j] = ((dotcodelen==28)?longheader[temp]:shortheader[temp]);
			}
		if(bin_type==0)
		{
			raw_header(bin,data,size);
			
			append_error_info(data,0x40,0x10);
			interleave_dotcode(data,dotcodetemp,0,size);
		}

		dotcodeinterleave = ((dotcodelen==28)?0x2C:0x1C);

		if(bin_type==0)
		{
			for(i=1;i<dotcodeinterleave;i++)
			{
				for(j=0;j<0x30;j++)
					data[j]=bin[((i-1)*0x30)+0x0C+j];
				append_error_info(data,0x40,0x10);
				interleave_dotcode(data,dotcodetemp,i,size);
			}
		}
		else
		{
			for(i=0;i<dotcodeinterleave;i++)
			{
				for(j=0;j<0x30;j++)
					data[j]=bin[(i*0x30)+((bin_type==1)?0:8)+j];
				append_error_info(data,0x40,0x10);
				interleave_dotcode(data,dotcodetemp,i,size);
			}
		}

		j=((dotcodelen==28)?0xB38:0x724);
		k=((dotcodelen==28)?0xB60-j:0x750-j);

		dotcodepointer = 0;

		for(i=2;i<j;i++)
		{
			if((i%0x68)==0)
				i+=2;
			raw[i]=dotcodetemp[dotcodepointer++];
		}
		for(i=j;i<(j+k);i++)
		{
			if(signature)
				raw[i]=signature_str[i-j];
			else
				raw[i]=i&0xFF;
		}

		if(MultiStrip)
		{
			if(nedc_fopen(&g,rawfile,"rb+"))
				if(nedc_fopen(&g,rawfile,"wb"))
					return -4;
			fseek(g,0,SEEK_END);  //Append raw to end of existing raw file.
		}
		else
		{
			if(nedc_fopen(&g,rawfile,"wb"))
				return -4;
		}
		fwrite(raw,1,j+k,g);
		fclose(g);
	}
	
	free_rs();

	return 0;
}